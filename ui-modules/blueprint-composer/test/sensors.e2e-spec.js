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
    
describe('Sensors', ()=> {
   
    beforeEach(function() {
        browser.get('./');
        browser.waitForAngular();
    });

    debugger;
    element(by.css('.list-group a[title="Entities catalog"]')).click();
    let searchInput = element(by.model('search'));
    searchInput.sendKeys('appliance');

    it('should contain the sensor svg near the appliance node', () => {
        let firstAppliance = $('.catalog-palette-item:nth-child(1)');
        firstAppliance.click().then( () => {
            $('.popover.catalog-selector-popover .btn.select-item-button').click().then( () => {
                let firstchild = element.all(by.xpath('//*[local-name()="g" and @class="node node-child"]')).first();
                let sensor = firstchild.element(by.xpath('//*[@class="node-sensors"]'));
                expect(sensor.isPresent()).toBeTruthy();
            });
        });
    });
    it('should display the list of sensors for an appliance', () => {
        debugger;
        element(by.css('.list-group a[title="Entities catalog"]')).click();
        let searchInput = element(by.model('search'));
        searchInput.sendKeys('linux-appliance');
        
        let firstAppliance = $('.catalog-palette-item:nth-child(1)');
        firstAppliance.click().then( () => {
            $('.popover.catalog-selector-popover .btn.select-item-button').click().then( () => {
                let firstchild = element.all(by.xpath('//*[local-name()="g" and @class="node node-child"]')).first();
                let sensor = firstchild.element(by.xpath('//*[@class="node-sensors"]'));
                sensor.click().then(()=>{
                    expect($('.sensors-palette .palette-title').getText()).toContain("Sensors of");
                    expect($('sensors-list .title-separator:nth-child(1)').getText()).toContain("Generic sensor");
                    let sensors = element.all(by.repeater('sensor in sensors'));
                    sensors.count().then((size)=>{
                        expect(size).toBe(15)
                    });
                })
            });
        });
    });
});
    