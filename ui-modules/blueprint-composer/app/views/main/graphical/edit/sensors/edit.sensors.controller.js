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
import template from './edit.sensors.template.html';

export function EditSensorsController($scope, $rootScope, entity) {
    function updateSensorsLists() {
        $scope.genericSensors = [];
        $scope.specificSensors = [];
        entity.miscData.get('sensors')
            .forEach(sensor => {
                if (sensor.template) {
                    $scope.specificSensors.push(sensor);
                } else {
                    $scope.genericSensors.push(sensor);
                }
            });
        sortSensors($scope.genericSensors);
        sortSensors($scope.specificSensors);
    }
    updateSensorsLists();
    $rootScope.$on('UpdateSensorsList', () => {
        updateSensorsLists();
    });
}

export const graphicalEditSensorsState = {
    name: 'main.graphical.edit.sensors',
    url: '/sensors',
    template: template,
    controller: ['$scope', '$rootScope', 'entity', EditSensorsController],
    controllerAs: 'vm',
};

function sortSensors(sensors) {
    sensors.sort((a, b) => {
        if (a.name) {
            return a.name.localeCompare(b.name);
        } else {
            return 1;
        }
    });
}