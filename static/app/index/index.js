"use strict";

var indexApp = angular.module('indexApp', ['d3mapping']);

indexApp.controller('indexCtrl', ['$scope', '$http', '$interval', "$window", 'mapService', 'highlightService', 'httpRequests', function ($scope, $http, $interval, $window, mapService, highlightService, httpRequests) {

    // functions to refresh only on 5 minutes of idling
    // 5 minutes
    const refreshTime = 300000;

    // start interval promise
    var checkIdle = $interval(function () {
        $window.location.href = '/';
    }, refreshTime);

    // destroy promise and create new promise to reset the time
    var resetCheck = function () {
        $interval.cancel(checkIdle);
        checkIdle = $interval(function () {
            $window.location.href = '/';
        }, refreshTime);
    };

    // any click will reset the clock
    $('body').click(function () {
        resetCheck();
    });

    // request to sheets and parse the data
    httpRequests.pub_getCatalog().then(function (data) {
        $scope.data = data;

        // minimized property names for object
        $scope.dataLabels = data[1];

        // get key index dynamically
        var keyIndex = $scope.dataLabels.indexOf('key');

        // pretty property names to display
        $scope.entryProperties = data[0];

        // removed first 2 frozen rows
        $scope.data.shift();
        $scope.data.shift();
        var shiftedData = $scope.data;

        // object entries
        $scope.entries = {};

        // use loop to populate the object
        for (var i in shiftedData) {
            var object = {};

            for (var j in $scope.dataLabels) {
                // ex. object.name.label
                object[$scope.dataLabels[j]] = shiftedData[i][j];
            }
            $scope.entries[shiftedData[i][keyIndex]] = object;
        }

        // make category data
        $scope.studioEntries = {};
        $scope.materialEntries = {};
        $scope.toolEntries = {};
        $scope.consumableEntries = {};

        for (var key in $scope.entries) {
            switch ($scope.entries[key].type) {
                case 'Studio':
                    $scope.studioEntries[key] = $scope.entries[key];
                    break;
                case 'Material':
                    $scope.materialEntries[key] = $scope.entries[key];
                    break;
                case 'Tool':
                    $scope.toolEntries[key] = $scope.entries[key];
                    break;
                case 'Consumable':
                    $scope.consumableEntries[key] = $scope.entries[key];
            }
        }
        console.log($scope.entries);

    });
    // GET END

    $scope.sendQueryAnalytic = function () {
        ga('send', 'event', 'Search query', 'click', $scope.queryTerm);
    };
    $scope.sendClickAnalytic = function (entry) {
        ga('send', 'event', 'Clicked an Entry', 'click', [entry.name, entry.type, entry.key]);

        $scope.sendQueryAnalytic();
    };

    $scope.sendMapAnalytic = function (entry) {
        ga('send', 'event', 'Click an entry on the map', 'click', [entry.name, entry.type, entry.key]);
    };


    $scope.categories = {
        'studio': 'Studios',
        'tools': 'Tools',
        'cons': 'Consumables',
        'mats': 'Materials'
    };

    // map controller
    // TODO: Change map to map (error in d3map??)
    $scope.map = mapService.initMap('firstFloorWell', 1);
    $scope.resizemap = mapService.resize($scope.map);

    $scope.queryTerm = '';
    // change height of query result box dynamically
    $scope.changeHeight = function () {
        if ($scope.queryTerm.length >= 2) {
            $('.in').removeClass('in');
            $('#searchSection').removeClass('hidden');
        } else {
            $('#searchSection').addClass('hidden');
        }
    };

    // close result box on panel click
    $scope.forceShrinkSearch = function () {
        var id = $('#searchSection');
        id.addClass('hidden');
    };

    $scope.clearSearch = function () {
        $scope.queryTerm = '';
        $scope.forceShrinkSearch();
    };

    // using service to highlight items
    $scope.highlightItem = highlightService.highlight;

    // search bar functions
    var isIndexOf = function (property) {
        if (property == undefined) {
            return false;
        } else if (property.toLowerCase().indexOf($scope.queryTerm.toLowerCase()) != -1) {
            return true;
        }
    };

    // set of properties to look through
    var isIndexOfSet = function (entry) {
        if (isIndexOf(entry.name) ||
            isIndexOf(entry.type) ||
            isIndexOf(entry.subtype) ||
            isIndexOf(entry.keywords)) {
            return true;
        }
    };

    $scope.filterSearch = function (entry) {
        if ($scope.queryTerm.length >= 2) {
            if (isIndexOfSet(entry)) {
                $('#query_' + entry.key).addClass('searchMargins');
                return entry.name;
            } else {
                $('#query_' + entry.key).removeClass('searchMargins');
                return '';
            }
        }
    };

    // default panel message
    $scope.panelBodyMessage = "Select a category to find all its listings. Search for a specific item or keyword through the search bar.";

    $scope.panelTitleName = 'MakerLabs Catalog System';
    $scope.panelTitleType = '';

    var getImage = function (type, image) {
        httpRequests.getImage(type + '/' + image)
            .then(function (url) {
                $("#entryImg").removeClass("hidden");
                $("#loading").addClass("hidden");
                $("#entryImg").attr("src", url).on("error", function () {
                    $("#entryImg").addClass("hidden");
                });
            });
    };

    var sublocationImage = function (sublocation) {
        httpRequests.getImage('Sublocation' + '/' + sublocation)
            .then(function (url) {
                $("#sublock-btn").removeClass("btn-default btn-danger").addClass("btn-success").attr("disabled", false);
                $("#subloc-image").attr("src", url).on("error", function () {
                    $("#subloc-image").addClass("hidden");
                    $("#sublock-btn").removeClass("btn-default").addClass("btn-danger").attr("disabled", true);
                });
            });
    };

    // display entry details when clicked
    $scope.showEntryDetails = function (entry) {
        $("#entryImg").addClass("hidden");
        $("#not-found").addClass("hidden");
        $("#loading").removeClass("hidden");
        $("#subloc-image").removeClass("hidden");
        $("#sublocation").removeClass("in");
        $("#sublock-btn").removeClass("btn-danger btn-success").addClass("btn-default").attr("disabled", false);


        // get image
        getImage(entry.type, entry.image);
        sublocationImage(entry.sublocation);

        $scope.selectedObject = entry;

        // initialize title
        $scope.panelTitleName = entry.name;
        $scope.panelTitleType = entry.type;
        $('#panelTitleName').addClass('whiteFont');

        // change color of panel title
        var elem = $('#indexPanelHeading');
        var remove = 'red blue orange green white';
        switch (entry.type) {
            case 'Studio':
                elem.removeClass(remove).addClass('red');
                break;
            case 'Tool':
                elem.removeClass(remove).addClass('blue');
                break;
            case 'Material':
                elem.removeClass(remove).addClass('orange');
                break;
            case 'Consumable':
                elem.removeClass(remove).addClass('green');
        }

        $('#entryBody').addClass('hidden');
        $('#entryDetails').removeClass('hidden');

        $scope.isEmpty = function (prop) {
            return !($scope.selectedObject[prop] === '' ||
            prop === 'locx' ||
            prop === 'locy' ||
            prop === 'metadata' ||
            prop === 'name' ||
            prop === 'image' ||
            prop === 'key');
        };
    };

    var lastItem = null;
    //Highlight the studio given the name of the studio as a param
    $scope.showLoc = function (entry) {
        removeLast(lastItem);
        lastItem = entry;

        if (entry.type == 'Studio') {
            $scope.map.studio.highlight(entry.key);
        } else {
            if (entry.metadata) {
                $scope.map.markers.draw($scope.map.width(), JSON.parse(entry.metadata));
            }
        }
        $scope.map.selectFloor(Number(entry.floor));
    };

    var removeLast = function (lastItem) {
        $scope.map.markers.hide();
        if (lastItem != undefined) {
            $scope.map.studio.dehighlight(lastItem.key);
        }
    };

    // combined function
    $scope.onSelect = function (entry, category) {
        $scope.showEntryDetails(entry);
        $scope.showLoc(entry);
        $scope.highlightItem(category + '_' + entry.key, entry.type);
        $scope.sendClickAnalytic(entry);
    };

    $scope.changeFloor = function () {
        $scope.map.nextFloor();
        $scope.map.resize();
    };

}]);

// promise services for http requests
indexApp.factory('httpRequests', function ($http) {
    // return the function
    return {
        pub_getCatalog: function () {
            // return the promise from http
            return $http.get('/publicGetCatalog')
                .then(function (result) {
                    // return the data
                    return result.data;
                })
        },
        getImage: function (key) {
            return $http.post('object', [key])
                .then(function (url) {
                    return String(url.data);
                })
        }
    }
});

// service to share methods for map construction and resizing
indexApp.service('mapService', function () {
    var map = function (id, num) {
        // mapConstructor = map
        return new mapConstructor(id, num);
    };

    var resizeMap = function (map) {
        // map.resize
        map.resize();
    };

    return {
        initMap: map,
        resize: resizeMap
    }
});

// service to highlight items
indexApp.service('highlightService', function () {
    var lastObject = null;

    var highlight = function (objectId, type) {
        var changeSelection = function (color) {
            $('#' + lastObject).removeClass('whiteFont lightRed lightOrange lightGreen lightBlue');
            $('#' + objectId).addClass('whiteFont ' + color);
            lastObject = objectId;
        };

        switch (type) {
            case 'Studio':
                changeSelection('lightRed');
                break;
            case 'Material':
                changeSelection('lightOrange');
                break;
            case 'Consumable':
                changeSelection('lightGreen');
                break;
            case 'Tool':
                changeSelection('lightBlue');
        }
    };

    var clearHighlight = function () {
        $('#' + lastObject).removeClass('whiteFont lightRed lightOrange lightGreen lightBlue');
    };

    return {
        highlight: highlight,
        clearHighlight: clearHighlight
    }
});
