define([
        './datasource',
        './query_ctrl'
    ],
    function (AtsdDatasource, AtsdQueryCtrl) {
        'use strict';

        var AtsdConfigCtrl = function () {
        };

        AtsdConfigCtrl.templateUrl = "partials/config.html";

        var InfluxDB08QueryOptionsCtrl = function () {
        };

        var InfluxDB08AnnotationsCtrl = function () {
        };

        return {
            'Datasource': AtsdDatasource,
            'QueryCtrl': AtsdQueryCtrl,
            'ConfigCtrl': AtsdConfigCtrl,
            'QueryOptionsCtrl': InfluxDB08QueryOptionsCtrl,
            'AnnotationsQueryCtrl': InfluxDB08AnnotationsCtrl
        };
    });
