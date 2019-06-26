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
import template from './sensors-list.template.html';

const MODULE_NAME = 'brooklyn.components.sensors';
const TEMPLATE_URL = 'blueprint-composer/component/sensors-list/index.html';

angular.module(MODULE_NAME, [])
    .directive('sensorsList', sensorsListDirective)
    .run(['$templateCache', templateCache]);

export default MODULE_NAME;

export function sensorsListDirective() {
    return {
        restrict: 'E',
        templateUrl: function(tElement, tAttrs) {
            return tAttrs.templateUrl || TEMPLATE_URL;
        },
        scope: {
            title: '=title',
            sensors: '=sensors'
        },
        link: function($scope) {
            $scope.editionName = null;
            $scope.updateSensorYaml = function(sensor) {
                $scope.editionName = sensor.template['brooklyn.config'].name;
                sensor.updateMetainfo();
            }
            $scope.editionMode = function(event, sensor) {
                event.stopPropagation();
                if (sensor) {
                    $scope.editionName = sensor.template['brooklyn.config'].name;
                } else {
                    $scope.editionName = null;
                }
            }
            $scope.delete = function(event, sensor) {
                event.stopPropagation();
                sensor.deleteSensor();
                for(let i = 0; i < $scope.sensors.length; i++){ 
                    if ($scope.sensors[i] === sensor) {
                        $scope.sensors.splice(i, 1);
                        break;
                    }
                }
            }
        }
    };
}

function templateCache($templateCache) {
    $templateCache.put(TEMPLATE_URL, template);
}
