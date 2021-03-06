/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import angular from 'angular';
import {Entity} from "../util/model/entity.model";
import {D3Blueprint} from "../util/d3-blueprint";
import {EntityFamily} from '../util/model/entity.model';
import {graphicalEditEntityState} from '../../views/main/graphical/edit/entity/edit.entity.controller';
import {graphicalEditSpecState} from '../../views/main/graphical/edit/spec/edit.spec.controller';
import {graphicalEditPoliciesState} from '../../views/main/graphical/edit/policies/edit.policies.controller';
import {graphicalEditEnricherState} from '../../views/main/graphical/edit/enricher/edit.enricher.controller';
import {graphicalEditSensorsState} from '../../views/main/graphical/edit/sensors/edit.sensors.controller';

const MODULE_NAME = 'brooklyn.components.designer';
const TEMPLATE_URL = 'blueprint-composer/component/designer/index.html';
const ANY_MEMBERSPEC_REGEX = /(^.*[m,M]ember[s,S]pec$)/;
const TAG = 'DIRECTIVE :: DESIGNER :: ';

angular.module(MODULE_NAME, [])
    .directive('designer', ['$log', '$state', '$q', 'iconGenerator', 'catalogApi', 'blueprintService', 'brSnackbar', 'paletteDragAndDropService', designerDirective])
    .run(['$templateCache', templateCache]);

export default MODULE_NAME;

export function designerDirective($log, $state, $q, iconGenerator, catalogApi, blueprintService, brSnackbar, paletteDragAndDropService) {
    return {
        restrict: 'E',
        templateUrl: function (tElement, tAttrs) {
            return tAttrs.templateUrl || TEMPLATE_URL;
        },
        scope: {
            onSelectionChange: '<?'
        },
        link: link
    };

    function link($scope, $element) {
        let blueprintGraph = new D3Blueprint($element[0], $scope).center();

        $scope.blueprint = blueprintService.get();
        $scope.$watch('blueprint', ()=> {
            redrawGraph();
        }, true);

        blueprintService.refreshBlueprintMetadata().then(()=>{
            redrawGraph();
        });

        $scope.selectedEntity = null;
        $scope.selectedNodePart = EntityFamily.ENTITY;

        $scope.$on('d3.redraw', (event, initial)=> {
            $log.debug(TAG + 'Re-draw blueprint, triggered by ' + event.name, $scope.blueprint);

            blueprintService.refreshBlueprintMetadata().then(()=>{
                redrawGraph();
                if (initial) {
                    blueprintGraph.center();
                }
            });
        });

        $scope.$on('d3.center', (event, left, right) => {
            blueprintGraph.center(left, right);
        });

        $scope.$on('d3.remove', (event, entity)=> {
            $log.debug(TAG + `Delete ${entity.family.displayName} ${entity._id}`, entity);

            let relationships = blueprintService.getRelationships().filter((relation)=>(relation.target === entity));

            switch (entity.family) {
                case EntityFamily.ENTITY:
                    if ($scope.onSelectionChange) $scope.onSelectionChange(undefined);
                    entity.delete();
                    break;
                case EntityFamily.POLICY:
                    entity.parent.removePolicy(entity._id);
                    break;
                case EntityFamily.ENRICHER:
                    entity.parent.removeEnricher(entity._id);
                    break;
                case EntityFamily.SPEC:
                    let memberSpecMap = entity.parent.getClusterMemberspecEntities();
                    Object.keys(memberSpecMap).forEach((key)=> {
                        if (memberSpecMap[key] === entity) {
                            entity.parent.removeConfig(key);
                        }
                    });
                    break;
            }

            $q.all(relationships.map((relation)=>(blueprintService.refreshRelationships(relation.source)))).then(()=> {
                $scope.$applyAsync(()=> {
                    redrawGraph();
                    $state.go('main.graphical');
                });
            });
        });

        $scope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams, options)=> {
            let id;
            switch(toState) {
                case graphicalEditEntityState:
                    id = toParams.entityId;
                    $scope.selectedNodePart = EntityFamily.ENTITY;
                    break;
                case graphicalEditSensorsState:
                    id = toParams.entityId;
                    $scope.selectedNodePart = EntityFamily.SENSORS;
                    break;
                case graphicalEditSpecState:
                    id = toParams.specId;
                    $scope.selectedNodePart = EntityFamily.SPEC;
                    break;
                case graphicalEditPoliciesState:
                    id = toParams.entityId;
                    $scope.selectedNodePart = EntityFamily.POLICY;
                    break;
                case graphicalEditEnricherState:
                    id = toParams.enricherId;
                    $scope.selectedNodePart = EntityFamily.ENRICHER;
                    break;
            }
            if (angular.isDefined(id)) {
                $log.debug(TAG + 'Select canvas, selected node: ' + id + ' part: ' + $scope.selectedNodePart.displayName);
                $scope.selectedEntity = blueprintService.findAny(id);
                if ($scope.onSelectionChange) $scope.onSelectionChange($scope.selectedEntity);
            }
            $scope.$applyAsync(()=> {
                redrawGraph();
            });
        });

        $element.bind('click-svg', (event)=> {
            $log.debug(TAG + 'Select canvas, un-select node (if one selected before)');
            $scope.selectedEntity = null;
            if ($scope.onSelectionChange) $scope.onSelectionChange($scope.selectedEntity);
            $scope.$apply(()=> {
                redrawGraph();
                $state.go('main.graphical');
            });
        });

        $element.bind('click-entity', (event)=> {
            $scope.$apply(()=>{
                $log.debug(TAG + 'edit node ' + event.detail.entity._id, event.detail.entity);
                switch (event.detail.entity.family) {
                    case EntityFamily.ENTITY:
                        $state.go(graphicalEditEntityState, {entityId: event.detail.entity._id});
                        break;
                    case EntityFamily.SPEC:
                        $state.go(graphicalEditSpecState, {entityId: event.detail.entity.parent._id, specId: event.detail.entity._id});
                        break;
                    case EntityFamily.ENRICHER:
                        $state.go(graphicalEditEnricherState, {entityId: event.detail.entity.parent._id, enricherId: event.detail.entity._id});
                        break;
                }
            });
        });

        $element.bind('click-sensors', (event)=> {
            $scope.$apply(()=>{
                $log.debug(TAG + 'edit sensors of node ' + event.detail.entity._id, event.detail.entity);
                $state.go(graphicalEditSensorsState, { entityId: event.detail.entity._id });
            });
        });

        $element.bind('click-policies', (event)=> {
            $scope.$apply(()=>{
                $log.debug(TAG + 'edit policies of node ' + event.detail.entity._id, event.detail.entity);
                $state.go(graphicalEditPoliciesState, {entityId: event.detail.entity._id});
            });
        });

        $element.bind('click-add-child', (event)=> {
            $log.debug(TAG + 'Add child to node ' + event.detail.entity._id);
            $scope.$apply(()=> {
                $state.go('main.graphical.edit.add', {entityId: event.detail.entity._id, family: 'entity'});
            });
        });

        $element.bind('move-entity', function (event) {
            let currentNode = blueprintService.find(event.detail.nodeId);
            let parentNode = blueprintService.find(event.detail.parentId);
            if (parentNode.hasAncestor(currentNode)) {
                brSnackbar.create('Cannot move an entity node below itself or its own descendants');
            } else {
                $log.debug(TAG + 'move-entity ' + event.detail.nodeId, currentNode);
                let targetIndex = event.detail.targetIndex;
                if (currentNode.parent === parentNode && targetIndex > parentNode.children.indexOf(currentNode)) {
                    targetIndex--;
                }
                currentNode.parent.removeChild(currentNode._id);
                if (targetIndex >= 0) {
                    parentNode.insertChild(currentNode, targetIndex);
                }
                else {
                    parentNode.addChild(currentNode);
                }
            }
            blueprintService.refreshAllRelationships().then(()=> {
                redrawGraph();
            });
        });


        $element.bind('delete-entity', function (event) {
            var removeEntity = () => {
                $log.debug('delete-entity');
                $scope.$broadcast('d3.remove', event.detail.entity);
            }
            if ($scope.confirmDelete != undefined) {
                $scope.confirmDelete().then(removeEntity);
            } else {
                removeEntity();
            }
        });

        $element.bind('drop-external-node', event => {
            let draggedItem = paletteDragAndDropService.draggedItem();
            let target = blueprintService.find(event.detail.parentId);

            if (draggedItem.supertypes.includes(EntityFamily.ENTITY.superType)) {
                let targetIndex = event.detail.targetIndex;
                let newEntity = blueprintService.populateEntityFromApi(new Entity(), draggedItem);
                if (targetIndex >= 0) {
                    target.insertChild(newEntity, targetIndex);
                } else {
                    target.addChild(newEntity);
                }
                blueprintService.refreshEntityMetadata(newEntity, EntityFamily.ENTITY).then(() => {
                    $state.go(graphicalEditEntityState, {entityId: newEntity._id});
                });
            }
            else if (draggedItem.supertypes.includes(EntityFamily.POLICY.superType)) {
                let newPolicy = blueprintService.populateEntityFromApi(new Entity(), draggedItem);
                target.addPolicy(newPolicy);
                blueprintService.refreshEntityMetadata(newPolicy, EntityFamily.POLICY).then(() => {
                    $state.go(graphicalEditPoliciesState, {entityId: target._id, policy: newPolicy});
                });
            }
            else if (draggedItem.supertypes.includes(EntityFamily.ENRICHER.superType)) {
                let newEnricher = blueprintService.populateEntityFromApi(new Entity(), draggedItem);
                target.addEnricher(newEnricher);
                blueprintService.refreshEntityMetadata(newEnricher, EntityFamily.ENRICHER).then(() => {
                    $state.go(graphicalEditEnricherState, {entityId: target._id, enricherId: newEnricher._id});
                });
            }
            else if (draggedItem.supertypes.includes(EntityFamily.LOCATION.superType)) {
                blueprintService.populateLocationFromApi(target, draggedItem);
                $state.go(graphicalEditEntityState, {entityId: target._id});
            }
            else if (draggedItem.supertypes.includes(EntityFamily.SENSORS.superType)) {
                let sensor = blueprintService.populateSensor(target, draggedItem);
                $state.go(graphicalEditSensorsState, {entityId: target._id, sensor: sensor});
            }
            blueprintService.refreshAllRelationships().then(()=> {
                redrawGraph();
            });
        });

        function redrawGraph() {
            $log.debug(TAG + 'redrawGraph ' + $scope.selectedNodePart.displayName, $scope.selectedEntity);
            let crossLinks = blueprintService.getRelationships();

            blueprintGraph.update($scope.blueprint, crossLinks).draw();
            if ($scope.selectedEntity) {
                switch($scope.selectedNodePart) {
                    case EntityFamily.SENSORS:
                        blueprintGraph.selectSensors($scope.selectedEntity._id);
                        break;
                    case EntityFamily.POLICY:
                        blueprintGraph.selectPolicies($scope.selectedEntity._id);
                        break;
                    default:
                        blueprintGraph.select($scope.selectedEntity._id);
                }
            } else {
                blueprintGraph.unselect();
            }
        }
    }
}

function templateCache($templateCache) {
    $templateCache.put(TEMPLATE_URL, '');
}