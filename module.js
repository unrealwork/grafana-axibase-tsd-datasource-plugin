define([
    './datasource',
    './queryCtrl'
  ],
  function (AtsdDatasource, AtsdQueryCtrl) {
    'use strict';

    var InfluxDB08ConfigCtrl = function () {
    };

    InfluxDB08ConfigCtrl.templateUrl = "partials/config.html";

    var InfluxDB08QueryOptionsCtrl = function () {
    };

    var InfluxDB08AnnotationsCtrl = function () {
    };

    return {
      'Datasource': AtsdDatasource,
      'QueryCtrl': AtsdQueryCtrl,
      'ConfigCtrl': InfluxDB08ConfigCtrl,
      'QueryOptionsCtrl': InfluxDB08QueryOptionsCtrl,
      'AnnotationsQueryCtrl': InfluxDB08AnnotationsCtrl
    };
  });
