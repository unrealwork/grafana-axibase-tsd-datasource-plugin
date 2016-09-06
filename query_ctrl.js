define([
        'angular',
        'lodash',
        'app/plugins/sdk'
    ],
    function (angular, _, sdk) {
        'use strict';

        var AtsdQueryCtrl = (function (_super) {
            var self;

            function suggestEntitiesList() {
                return self.datasource.getEntities({
                    expression: 'name LIKE \'*\'',
                });
            }

            function AtsdQueryCtrl($scope, $injector) {
                _super.call(this, $scope, $injector);
                self = this;

                this.suggest = {
                    metrics: [],
                    entities: [],
                    aggregations: aggregateOptions()
                };

                this.segments = {};
                this.segments.tagEditor = {
                    key: undefined,
                    value: undefined
                };

                this.state = {
                    isLoaded: true,
                    tagRow: {
                        isEdit: false,
                        canAdd: true,
                        tags: []
                    }
                };

                this.scope = $scope;

                if (this.target.entity) {
                    self.entityBlur();
                }

                this.target.tags = [];

                this.target.aggregation = this.suggest.aggregations[0].value;

                console.log(this.target);

                suggestEntitiesList().then(function (result) {
                    result.forEach(function (item) {
                        self.suggest.entities.push(item.name);
                    });
                    self.state.isLoaded = false;
                });

            }


            AtsdQueryCtrl.prototype = Object.create(_super.prototype);
            AtsdQueryCtrl.prototype.constructor = AtsdQueryCtrl;

            AtsdQueryCtrl.prototype.entityBlur = function ($event) {
                self.panelCtrl.refresh();
                console.log($event);
                this.datasource.getMetrics(this.target.entity, {}).then(function (result) {
                    console.log(result);
                    self.suggest.metrics.length = 0;
                    result.forEach(function (item) {
                        self.suggest.metrics.push(item.name);
                    })
                })
            };

            AtsdQueryCtrl.prototype.getOptions = function () {
                return this.datasource.metricFindQuery(this.target)
                    .then(this.uiSegmentSrv.transformToSegments(false));
                // Options have to be transformed by uiSegmentSrv to be usable by metric-segment-model directive
            };

            AtsdQueryCtrl.prototype.toggleEditorMode = function () {
                this.target.rawQuery = !this.target.rawQuery;
            };

            AtsdQueryCtrl.onChangeInternal = function () {
                this.panelCtrl.refresh(); // Asks the panel to refresh data.
            };

            AtsdQueryCtrl.prototype.tagEdit = function (index) {
                console.log('a');
                this.segments.tagEditor.key = this.target.tags[index].key;
                this.segments.tagEditor.value = this.target.tags[index].value;
                this.state.tagRow.tags[index].isEdit = true;
                this.state.tagRow.isEdit = true;
                this.state.tagRow.isEdit = true;

            };

            AtsdQueryCtrl.prototype.tagMouseover = function (index) {
                this.state.tagRow.tags[index].selected = true;
            };

            AtsdQueryCtrl.prototype.tagMouseleave = function (index) {
                this.state.tagRow.tags[index].selected = false;
            };

            AtsdQueryCtrl.prototype.saveTag = function (index) {
                var editorValue = {
                    key: this.segments.tagEditor.key,
                    value: this.segments.tagEditor.value
                };
                if (index) {
                    this.segments.tags[index] = editorValue
                } else {
                    this.target.tags.push(editorValue);
                    this.state.tagRow.tags.push({selected: false});
                }

                this.state.tagRow.isEdit = false;
                this.state.tagRow.canAdd = true;
                self.segments.tagEditor.key = "";
                self.segments.tagEditor.value = "";
            };

            AtsdQueryCtrl.prototype.showTagEditor = function (index) {
                self.state.tagRow.isEdit = true;
                self.state.tagRow.canAdd = false;
                this.state.tagRow.isEdit = true;
                this.state.tagRow.isEdit = true;
            };

            AtsdQueryCtrl.prototype.closeTagEditor = function () {
                self.state.tagRow.isEdit = false;
                self.state.tagRow.canAdd = true;
                self.segments.tagEditor.key = "";
                self.segments.tagEditor.value = "";
            };

            AtsdQueryCtrl.templateUrl = 'partials/query.editor.html';

            /**
             * Init aggregate options collection
             * for select element
             *
             * @param scope
             */
            function aggregateOptions() {
                return [{
                    id: 1,
                    label: 'Detail',
                    value: {
                        name: 'detail'
                    }
                }, {
                    id: 2,
                    label: 'Count',
                    value: {
                        name: 'count'
                    }
                }
                ];
            }


            return AtsdQueryCtrl;
        })(sdk.QueryCtrl);


        return AtsdQueryCtrl;
    })
;
