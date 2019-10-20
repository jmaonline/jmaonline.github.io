/// <reference path="../../../typings/locator/locator-core.d.ts" />
/// <reference path="../../../typings/requirejs/require.d.ts" />
/// <reference path="../../../typings/jquery/jquery.d.ts" />
/// <reference path="../../../typings/googlemaps/google.maps.d.ts" />
define(['jquery'], function ($) {
    "use strict";
    var coreSettings = {
        debug: false,
        brands: ['wbc', 'stg', 'bom', 'bsa']
    };
    var maxSearchLimit = 10;
    var baseUrl = "//www.westpac.com.au/";
    var locatorURL = baseUrl + "locator/LocateUsSearchService/";
    var imageURL = baseUrl + "furniture/locateus/ui_imgs/";
    var gmapsBaseUrl = "//maps.googleapis.com/maps/";
    var gmapsGeocoderURL = gmapsBaseUrl + "api/geocode/json";
    var gmapsUrl = gmapsBaseUrl + "api/js?sensor=false";
    var gmapsDirectionsUrl = "//www.google.com/maps/dir/";
    var timeoutSeconds = 30;
    var icons = {};
    var geocoder;
    var geocoderBusy = false;
    var validCountryNames = ["Australia", "Christmas Island"];
    var distanceMatrixService;
    var map, infowindow;
    var mapOptions = {};
    var lastZoom = 3;
    var minZoom = 4;
    var singleResultMaxZoom = 16;
    var newSearch = false;
    var locatorCoreEventNamespace = 'locator-core:';
    var lastSelectedMarker = null;
    var inDirectionsMode = false;
    var inFilteredMode = false;
    var lastCenter = null;
    var searchResults = [];
    var mapMarkers = {
        search: {},
        directions: {}
    };
    var errorMessages = {
        "OK": "Success",
        "NOT_FOUND": "Sorry, but we have no record of that address.",
        "ZERO_RESULTS": "Sorry, but we have no record of that address.<br/>Before trying again, " +
            "please check that:<br/>- All street and city names are spelled correctly<br/>- " +
            "Your address includes a city and state<br/>- You include a postcode.",
        "MAX_WAYPOINTS_EXCEEDED": "Sorry, too many way points were provided in the request.",
        "INVALID_REQUEST": "Sorry, we apologise but the service is temporarily unavailable. " +
            "Please check back soon and try again.",
        "OVER_QUERY_LIMIT": "Sorry, but there has been a Google system error. " +
            "We could not process your request right now. Please try again later.",
        "REQUEST_DENIED": "Sorry, we apologise but the service is temporarily unavailable. " +
            "Please check back soon and try again.",
        "UNKNOWN_ERROR": "Sorry, but circumstances beyond our control has meant your " +
            "request could not be processed. We sincerely apologise for any inconvenience. Please try again soon."
    };
    var initialiseComplete = $.Deferred();
    var redrawExcludeOthers = false;
    var labelClassName = 'map-marker-label';
    var labelHighlightClassName = 'map-marker-label-highlight';
    var NO_AUSTRALIAN_RESULTS = "No Australian results";
    var markerClickCbFuntion = function () { };
    function logDebug(debugStr) {
        if (coreSettings.debug) {
            console.log(debugStr);
        }
    }
    function isDefined(elem) {
        return (typeof elem !== 'undefined' && elem != null);
    }
    function getErrorMessage(errorCode) {
        return errorMessages[errorCode];
    }
    function locatorCore() {
        logDebug("Component loaded: locator/core/locator-core-4.0");
        var locatorCoreClosure, processAddressResolution, findLocationsNear, processSearchData, setStatusText, processClusterData, redrawResults, addMarker, addClusterMarker, validateSearchInput, redrawResultsComplete, unhighlightMarker;
        var MarkerLabel = function (options) {
            this.setValues(options);
            this.span = document.createElement('span');
            this.span.className = 'map-marker-label';
        };
        var createIcons = function () {
            var brandIcons = [];
            var clusterIcon;
            for (var i = 0; i < coreSettings.brands.length; i++) {
                var branchIcon = new google.maps.Marker({
                    position: null,
                    icon: {
                        url: locatorCoreClosure.imagePath() + coreSettings.brands[i] + "/branch.png",
                        size: new google.maps.Size(20, 20),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(10, 10)
                    }
                }).getIcon();
                var branchActiveIcon = new google.maps.Marker({
                    position: null,
                    icon: {
                        url: locatorCoreClosure.imagePath() + coreSettings.brands[i] + "/branch_active.png",
                        size: new google.maps.Size(41, 66),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(21, 66)
                    }
                }).getIcon();
                var atmIcon = new google.maps.Marker({
                    position: null,
                    icon: {
                        url: locatorCoreClosure.imagePath() + coreSettings.brands[i] + "/atm.png",
                        size: new google.maps.Size(20, 20),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(10, 10)
                    }
                }).getIcon();
                var atmActiveIcon = new google.maps.Marker({
                    position: null,
                    icon: {
                        url: locatorCoreClosure.imagePath() + coreSettings.brands[i] + "/atm_active.png",
                        size: new google.maps.Size(41, 66),
                        origin: new google.maps.Point(0, 0),
                        anchor: new google.maps.Point(21, 66)
                    }
                }).getIcon();
                brandIcons[i] = {
                    branch: branchIcon,
                    branch_active: branchActiveIcon,
                    atm: atmIcon,
                    atm_active: atmActiveIcon
                };
            }
            clusterIcon = new google.maps.Marker({
                position: null,
                icon: {
                    url: locatorCoreClosure.imagePath() + "cluster.png",
                    size: new google.maps.Size(21, 21),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(10, 21)
                }
            }).getIcon();
            var directionsStart = new google.maps.Marker({
                position: null,
                icon: {
                    url: locatorCoreClosure.imagePath() + "directions_start.png",
                    size: new google.maps.Size(48, 37),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(0, 37)
                }
            }).getIcon();
            var directionsEnd = new google.maps.Marker({
                position: null,
                icon: {
                    url: locatorCoreClosure.imagePath() + "directions_end.png",
                    size: new google.maps.Size(48, 37),
                    origin: new google.maps.Point(0, 0),
                    anchor: new google.maps.Point(0, 37)
                }
            }).getIcon();
            icons.brandIcons = brandIcons;
            icons.clusterIcon = clusterIcon;
            icons.directionsStart = directionsStart;
            icons.directionsEnd = directionsEnd;
        };
        var getMarkerIcon = function (location, active) {
            var icon;
            if (active) {
                if (location.serviceProviderTypeName && location.serviceProviderTypeName === "ATM") {
                    icon = icons.brandIcons[coreSettings.brands.indexOf(location.brandCode)].atm_active;
                }
                else {
                    icon = icons.brandIcons[coreSettings.brands.indexOf(location.brandCode)].branch_active;
                }
            }
            else {
                if (location.serviceProviderTypeName && location.serviceProviderTypeName === "ATM") {
                    icon = icons.brandIcons[coreSettings.brands.indexOf(location.brandCode)].atm;
                }
                else {
                    icon = icons.brandIcons[coreSettings.brands.indexOf(location.brandCode)].branch;
                }
            }
            return icon;
        };
        var getSearchResultsIndex = function (markerId) {
            if (searchResults) {
                var counter = -1;
                for (var i = 0; i < searchResults.length; i++) {
                    counter += 1;
                    if (searchResults[i].meta.markerPointId === markerId) {
                        return counter;
                    }
                }
            }
            return -1;
        };
        var deleteSearchResults = function () {
            searchResults = [];
        };
        var deleteAllOverlays = function (markerObj) {
            for (var i in markerObj) {
                if (markerObj.hasOwnProperty(i)) {
                    markerObj[i].marker.setMap(null);
                    google.maps.event.clearInstanceListeners(markerObj[i].marker);
                    delete markerObj[i];
                }
            }
        };
        var formatPhoneNumber = function (phoneNumber) {
            var output = phoneNumber;
            var input = phoneNumber.toString().replace(/[^0-9]+/g, '');
            if (input.length === 10 && input.indexOf("04") === 0) {
                output = input.substring(0, 4);
                output += " " + input.substring(4, 7);
                output += " " + input.substring(7);
                return output;
            }
            if (input.length === 10 && input.indexOf("0") === 0) {
                output = "(" + input.substring(0, 2) + ") ";
                output += input.substring(2, 6);
                output += "-" + input.substring(6);
                return output;
            }
            if (input.length === 7) {
                output = "67" + input.substring(0, 1) + " ";
                output += input.substring(1, 2);
                output += " ";
                output += input.substring(3);
                return output;
            }
            return output;
        };
        var getServiceProvidersString = function (serviceProviders) {
            var numOfBranch = 0;
            var numOfAdvisoryCentres = 0;
            var numOfInstore = 0;
            var numOfATM = 0;
            var numOfBBC = 0;
            if (serviceProviders) {
                for (var i = 0; i < serviceProviders.length; i++) {
                    var serviceProvider = serviceProviders[i];
                    var serviceProviderType = serviceProvider.type;
                    if ("ATM" === serviceProviderType) {
                        numOfATM++;
                    }
                    else if ("Branch" === serviceProviderType) {
                        numOfBranch++;
                    }
                    else if ("Advisory Centre" === serviceProviderType) {
                        numOfAdvisoryCentres++;
                    }
                    else if ("In Store" === serviceProviderType) {
                        numOfInstore++;
                    }
                    else if ("Business Banking Centre" === serviceProviderType) {
                        numOfBBC++;
                    }
                }
            }
            var providerString = "";
            if (numOfBranch > 0) {
                providerString += "Branch";
            }
            if (numOfAdvisoryCentres > 0) {
                if (providerString.length > 0) {
                    providerString += ", ";
                }
                providerString += "Advisory Centre";
            }
            if (numOfInstore > 0) {
                if (providerString.length > 0) {
                    providerString += ", ";
                }
                providerString += "Instore";
            }
            if (numOfBBC > 0) {
                if (providerString.length > 0) {
                    providerString += ", ";
                }
                providerString += "Business Banking Centre";
            }
            if (numOfATM > 0) {
                if (providerString.length === 0) {
                    providerString += "ATM only";
                }
                else {
                    if (providerString.length > 0) {
                        providerString += " / ATM";
                    }
                }
            }
            return providerString;
        };
        var createServiceProviderLink = function (branchObj) {
            var serviceProviderName = branchObj.name;
            var state = branchObj.state;
            var suburb = branchObj.suburb;
            var serviceProviderTypeName = branchObj.serviceProviderTypeName;
            var cordinates = branchObj.locationId;
            var link = "";
            if (serviceProviderTypeName) {
                if (serviceProviderTypeName.toLowerCase() === 'atm') {
                    link = link + "/" + 'atm';
                }
                else {
                    link = link + "/" + 'branch';
                }
            }
            else {
                logDebug("createServiceProviderLink() : ERROR - 'serviceProviderTypeName' not defined");
            }
            if (state) {
                link = link + "/" + state.replace(/[ ,&']+/g, '').toLowerCase();
            }
            else {
                logDebug("createServiceProviderLink() : ERROR - 'state' not defined");
            }
            if (suburb) {
                link = link + "/" + suburb.replace(/[ ,&']+/g, '').toLowerCase();
            }
            else {
                logDebug("createServiceProviderLink() : ERROR - 'suburb' not defined");
            }
            if (serviceProviderTypeName && serviceProviderTypeName.toLowerCase() === 'atm') {
                if (cordinates) {
                    link = link + "/" + cordinates;
                }
                else {
                    logDebug("createServiceProviderLink() : ERROR - 'cordinates' not defined");
                }
            }
            else {
                if (serviceProviderName) {
                    link = link + "/" + serviceProviderName.replace(/[ ,&']+/g, '').toLowerCase();
                }
                else {
                    logDebug("createServiceProviderLink() : ERROR - 'serviceProviderName' not defined");
                }
            }
            return link;
        };
        var sanitizeString = function (str) {
            var ds = '';

            try {
                ds = decodeURIComponent(str).replace(/[<>\(\)=.]*/g, '');
            } catch (error) {
                ds = '';
            }

            return ds;
        };
        var validateBsb = function (bsb) {
            return ((/^(\d{3}\-\d{3})$/).test(bsb) || (/^(\d{3} \d{3})$/).test(bsb) || (/^\d{6}$/).test(bsb));
        };
        var getSearchData = function (dataurl, options) {
            var settings = options || {};
            settings.cache = true;
            if (settings === undefined || settings.dataType === undefined) {
                settings.dataType = "jsonp";
            }
            if (settings === undefined || settings.timeout === undefined) {
                settings.timeout = timeoutSeconds * 1000;
            }
            if (locatorCoreClosure.servicePath() !== locatorURL && coreSettings.debug) {
                settings.dataType = "json";
            }

            if (dataurl && dataurl.toString().toLowerCase().indexOf("format=jsonp") > -1) {
                settings.dataType = "jsonp";
            }
            else if (dataurl && dataurl.toString().toLowerCase().indexOf("format") === -1) {
                dataurl += "&format=" + settings.dataType;
            }

            settings.beforeSend = function () {
            };



            settings.url = dataurl;
            return $.ajax(settings)
                .done(function () {
                logDebug("getSearchData callback done");
            })
                .fail(function (jqXHR, textStatus) {
                setStatusText('Sorry we are experiencing technical difficulties, please try again later.');
                logDebug("getSearchData ERROR: " + textStatus);
            });
        };
        var geoCode = function (addressClean) {
            var def = $.Deferred(), msg = NO_AUSTRALIAN_RESULTS;
            logDebug("address to geocode: " + addressClean + ' with geocodeOnly: ' + locatorCoreClosure.geocodeOnly());
            setStatusText('geocoding');
            if (locatorCoreClosure.geocodeOnly()) {
                var searchUrl = gmapsGeocoderURL + "?address=" + addressClean + "&key=AIzaSyDW1qi8gzWgkT6s28Snj4uvaTdWxfoBHJ4";
                getSearchData(searchUrl, {"dataType": "json"}).done(function (data) {
                    geocoderBusy = false;
                    var validAddress = processAddressResolution(data.results);
                    if (validAddress.length === 1) {
                        findLocationsNear(validAddress[0].geometry.location)
                            .done(function (list) {
                            def.resolve(list);
                        });
                    }
                    else if (validAddress.length > 1) {
                        def.resolve({ "results": validAddress });
                    }
                    else {
                        setStatusText(msg);
                        def.reject({ "errors": [{ "text": msg, "data": data }] });
                    }
                });
            }
            else {
                if (locatorCoreClosure.isMapLoaded()) {
                    geocoder.geocode({
                        'address': addressClean
                    }, function (result, status) {
                        geocoderBusy = false;
                        if (status === google.maps.GeocoderStatus.OK) {
                            var validAddress = processAddressResolution(result);
                            if (validAddress.length === 1) {
                                findLocationsNear(validAddress[0].geometry.location)
                                    .done(function (data) {
                                    def.resolve(data);
                                });
                            }
                            else if (validAddress.length > 1) {
                                def.resolve({ "results": validAddress });
                            }
                            else {
                                setStatusText(msg);
                                def.reject({ "errors": [{ "text": msg }] });
                            }
                        }
                        else {
                            msg = getErrorMessage(status);
                            setStatusText(msg);
                            def.reject({ "errors": [{ "text": msg }] });
                        }
                    });
                }
                else {
                    msg = "Google Maps API not loaded";
                    setStatusText(msg);
                    def.reject({ "errors": [{ "text": msg }] });
                }
            }
            return def.promise();
        };
        var resolveAddress = function (address) {
            var outerDef = $.Deferred(), msg = "";
            var addressClean = address.toString().replace(/^\s*/, "").replace(/\s*$/, "");
            if (!validateSearchInput(addressClean)) {
                msg = "Sorry, looks like no address was entered. Please try again.";
                setStatusText(msg);
                outerDef.reject({ "errors": [{ "text": msg }] });
            }
            else {
                if (address.toString().toLowerCase().indexOf('australia') === -1) {
                    addressClean += ', Australia';
                }
                geoCode(addressClean)
                    .done(function (data) {
                    outerDef.resolve(data);
                })
                    .fail(function (data) {
                    if (data.errors && data.errors[0].text === NO_AUSTRALIAN_RESULTS) {
                        addressClean += ', Australia';
                        geoCode(addressClean)
                            .done(function (data) {
                            outerDef.resolve(data);
                        })
                            .fail(function (data) {
                            outerDef.reject(data);
                        });
                    }
                    else {
                        outerDef.reject(data);
                    }
                });
            }
            return outerDef.promise();
        };
        var resolveBsb = function (bsb) {
            var def = $.Deferred();
            var bsbWithoutFormatting = bsb.replace(/[ -]/g, "");
            var isBsbValid = validateBsb(bsbWithoutFormatting);
            var msg;
            if (isBsbValid) {
                var bsbSearchUrl = locatorCoreClosure.servicePath() + "findByBsb?bsb=" + bsbWithoutFormatting;
                return getSearchData(bsbSearchUrl, {}).done(function () {
                });
            }
            else {
                msg = "Sorry, the BSB format appears to be entered incorrectly. " +
                    "Please ensure that only 6 digits appear in the correct order.";
                setStatusText(msg);
                return def.reject({ "errors": [{ "text": msg }] });
            }
        };
        var getAddressComponent = function (addressComponent) {
            var objNew = {};
            for (var i = 0; i < addressComponent.length; i++) {
                var obj = addressComponent[i];
                var objName = obj.types[0];
                objNew[objName] = obj;
            }
            return objNew;
        };
        processAddressResolution = function (result) {
            var validResult = [];
            for (var i = 0; i < result.length; i++) {
                var addressComponent = getAddressComponent(result[i].address_components);
                if (addressComponent.country &&
                    validCountryNames.join(',').indexOf(addressComponent.country.long_name) === -1) {
                    return validResult.splice(0);
                }
            }
            if (result.length > 0) {
                validResult = result;
            }
            else {
                setStatusText('Sorry, but we have no record of that address.<br/> ' +
                    'Before trying again, please check that:<br/>- All street and city names are ' +
                    'spelled correctly<br/>- Your address includes a city and state<br/>- You include a postcode.');
            }
            return validResult;
        };
        findLocationsNear = function (centre) {
            if (centre != null) {
                var searchUrl = locatorCoreClosure.servicePath() + locatorCoreClosure.searchType() + "?latitude=";
                if (locatorCoreClosure.geocodeOnly()) {
                    searchUrl += centre.lat + "&longitude=" + centre.lng;
                }
                else {
                    searchUrl += centre.lat() + "&longitude=" + centre.lng();
                }
                searchUrl += locatorCoreClosure.searchFilterString();
                return getSearchData(searchUrl, {}).done(function () {
                });
            }
            else {
                logDebug("ERROR: Map does not have a centre!");
            }
        };
        var createSearchResult = function (jsonObj) {
            var resultObj = jsonObj;
            resultObj.markerIcon = null;
            if (!locatorCoreClosure.geocodeOnly()) {
                if (jsonObj.serviceProviderTypeName && jsonObj.serviceProviderTypeName === "ATM") {
                    resultObj.markerIcon = icons.brandIcons[coreSettings.brands.indexOf(jsonObj.brandCode)].atm;
                }
                else {
                    resultObj.markerIcon = icons.brandIcons[coreSettings.brands.indexOf(jsonObj.brandCode)].branch;
                }
            }
            resultObj.brandIcon = locatorCoreClosure.imagePath() + '/' + jsonObj.brandCode + '/logo.png';
            var serviceProviderSummary = getServiceProvidersString(jsonObj.services);
            if (serviceProviderSummary === "" && jsonObj.serviceProviderTypeName) {
                serviceProviderSummary = jsonObj.serviceProviderTypeName;
            }
            resultObj.locationUrl = locatorCoreClosure.basePath() + createServiceProviderLink(jsonObj);
            resultObj.serviceProviderSummary = serviceProviderSummary;
            resultObj.duration = {};
            return resultObj;
        };
        processSearchData = function (data) {
            var markers = data.list;
            if (typeof markers !== 'object' || markers == null) {
                setStatusText("Sorry, we apologise but the service is temporarily unavailable. " +
                    "Please check back soon and try again.");
                return;
            }
            if (markers.length === 0) {
                setStatusText("Sorry, we could not find any locations matching your search criteria. " +
                    "Please try a new search.");
                return;
            }
            newSearch = true;
            for (var i = 0; i < markers.length; i++) {
                var jsonObj = createSearchResult(markers[i]);
                searchResults.push({
                    'meta': jsonObj
                });
            }
            if (!locatorCoreClosure.geocodeOnly()) {
                redrawResults(searchResults, redrawResultsComplete);
            }
        };
        var resetSearch = function () {
            logDebug("resetSearch");
            inFilteredMode = false;
            lastSelectedMarker = null;
            redrawExcludeOthers = false;
            deleteSearchResults();
            deleteAllOverlays(mapMarkers.search);
            deleteAllOverlays(mapMarkers.directions);
            if (infowindow) {
                infowindow.close();
            }
        };
        setStatusText = function (statusText) {
            locatorCoreClosure.statusText(statusText);
            logDebug(locatorCoreClosure.statusText());
        };
        var getVisibleLocations = function () {
            if (locatorCoreClosure.enableCluster()) {
                var zoomForSearch = locatorCoreClosure.getMap().getZoom();
                var mapBounds = locatorCoreClosure.getMap().getBounds();
                var SW = mapBounds.getSouthWest();
                var NE = mapBounds.getNorthEast();
                var searchUrl = locatorCoreClosure.servicePath() + "findInArea?upperLatitude=" + NE.lat() +
                    "&lowerLatitude=" + SW.lat() + "&eastLongitude=" + NE.lng() + "&westLongitude=" +
                    SW.lng() + "&zoomLevel=" + zoomForSearch;
                if (locatorCoreClosure.searchType() === "findByLocation") {
                    searchUrl += locatorCoreClosure.searchFilterString();
                }
                getSearchData(searchUrl, {})
                    .done(function (data) {
                    processClusterData(data);
                });
            }
        };
        processClusterData = function (data) {
            logDebug(data);
            if (data.map) {
                var clusters;
                var locations;
                var i;
                for (i = 0; i < 2; i++) {
                    if (data.map[i][0] === "locations") {
                        locations = data.map[i][1];
                    }
                    else if (data.map[i][0] === "clusters") {
                        clusters = data.map[i][1];
                    }
                }
                if (clusters.length === 0 && locations.length === 0) {
                    return;
                }
                deleteAllOverlays(mapMarkers.search);
                var jsonObj;
                var markerId = "";
                var marker;
                var point;
                for (i = 0; i < clusters.length; i++) {
                    jsonObj = clusters[i];
                    markerId = "" + jsonObj.clusterId;
                    if (isDefined(mapMarkers.search[markerId])) {
                        continue;
                    }
                    point = new google.maps.LatLng(jsonObj.latitude, jsonObj.longitude);
                    marker = addClusterMarker(point, jsonObj, icons.clusterIcon[0]);
                }
                if (searchResults) {
                    for (i = 0; i < searchResults.length; i++) {
                        searchResults[i].marker.setMap(map);
                        mapMarkers.search[searchResults[i].meta.markerPointId] = searchResults[i];
                    }
                }
                for (i = 0; i < locations.length; i++) {
                    var markerIcon = icons.brandIcons[0].branch;
                    jsonObj = locations[i];
                    markerId = "" + jsonObj.markerPointId;
                    if (isDefined(mapMarkers.search[markerId])) {
                        continue;
                    }
                    var searchResultsIndex = getSearchResultsIndex(markerId);
                    if (searchResultsIndex > -1 && searchResultsIndex < searchResults.length) {
                        if (jsonObj.serviceProviderTypeName && jsonObj.serviceProviderTypeName === "ATM") {
                            markerIcon = icons.brandIcons[coreSettings.brands.indexOf(jsonObj.brandCode)].atm;
                        }
                        else {
                            markerIcon = icons.brandIcons[coreSettings.brands.indexOf(jsonObj.brandCode)].branch;
                        }
                    }
                    else {
                        if (jsonObj.serviceProviderTypeName && jsonObj.serviceProviderTypeName === "ATM") {
                            markerIcon = icons.brandIcons[0].atm;
                        }
                    }
                    point = new google.maps.LatLng(jsonObj.latitude, jsonObj.longitude);
                    marker = addMarker(point, jsonObj, markerIcon);
                }
            }
        };

        /**
         * render the textual search result for display using underscore templating.
         */
        var renderSearchResult = function(locationObj) {
            var template = _.template(LocateUs.core.templateResults());
            return template(locationObj.meta);
        }

        redrawResults = function (markers, callback, excludeOthers) {
            var bounds = new google.maps.LatLngBounds(), map;
            if (markers === undefined) {
                markers = searchResults;
            }
            if (!locatorCoreClosure.geocodeOnly()) {
                deleteAllOverlays(mapMarkers.search);
                if (infowindow) {
                    infowindow.close();
                }
            }
            var maxSearchLimit = locatorCoreClosure.maxSearchLimit();
            var searchLimit = (markers.length <= maxSearchLimit || maxSearchLimit == null) ? markers.length : maxSearchLimit;
            var counter = 0;
            for (var i = 0; i < markers.length; i++) {
                if (counter < searchLimit) {
                    if (!locatorCoreClosure.geocodeOnly()) {
                        if (redrawExcludeOthers && isDefined(lastSelectedMarker)) {
                            if (markers[i].marker.markerId !== lastSelectedMarker.markerId) {
                                continue;
                            }
                        }
                        var locationObj = markers[i].meta;
                        var icon = icons.brandIcons[0].branch;
                        icon = getMarkerIcon(locationObj, lastSelectedMarker && markers[i].marker.markerId === lastSelectedMarker.markerId);
                        var point = new google.maps.LatLng(locationObj.latitude, locationObj.longitude);
                        markers[i].marker = addMarker(point, locationObj, icon);
                        bounds.extend(point);
                    }
                    counter++;
                }
            }
            if (counter > 0) {
                if (!locatorCoreClosure.geocodeOnly()) {
                    map = locatorCoreClosure.getMap();
                    map.fitBounds(bounds);
                    map.setCenter(bounds.getCenter());
                    if (counter === 1) {
                        map.setZoom(singleResultMaxZoom);
                    }
                    lastCenter = map.getCenter();
                }
            }
            else {
                setStatusText('No results found.');
            }
            if (callback && typeof callback === 'function') {
                callback();
            }
        };
        var resize = function () {
            var bounds = new google.maps.LatLngBounds(), map;
            if (!locatorCoreClosure.geocodeOnly()) {
                google.maps.event.trigger(locatorCoreClosure.getMap(), 'resize');
                for (var i = 0; i < searchResults.length; i++) {
                    bounds.extend(searchResults[i].marker.getPosition());
                }
                map = locatorCoreClosure.getMap();
                map.fitBounds(bounds);
                map.setCenter(bounds.getCenter());
                lastCenter = map.getCenter();
                if (searchResults.length === 1) {
                    map.setZoom(singleResultMaxZoom);
                }
            }
        };
        var createMarker = function (location, iconMarker, title) {
            var marker = new google.maps.Marker({
                position: location,
                map: map,
                icon: iconMarker,
                label: title
            });
            marker.setZIndex(0);
            if (title) {
                marker.setTitle(title);
            }
            return marker;
        };
        addMarker = function (location, meta, iconMarker) {
            var markerLabel = meta.name + (meta.serviceProviderSummary ? ('-' + meta.serviceProviderSummary) : ''), marker = createMarker(location, iconMarker, markerLabel);
            marker.markerId = meta.markerPointId;
            mapMarkers.search[meta.markerPointId] = {
                'marker': marker,
                'meta': meta
            };
            google.maps.event.addListener(marker, 'click', function () {
                highlightMarker(marker);
                setTimeout(function () {
                    if (markerClickCbFuntion && typeof markerClickCbFuntion === 'function') {
                        markerClickCbFuntion(meta.markerPointId);
                    }
                }, 50);
            });
            return marker;
        };
        addClusterMarker = function (location, meta, iconMarker) {
            var marker = new google.maps.Marker({
                position: location,
                map: map,
                icon: iconMarker,
                title: meta.clusterSize + " branches/ATMs (double click to zoom)"
            });
            marker.markerId = meta.clusterId;
            mapMarkers.search[meta.latitude + ":" + meta.longitude + ":" + meta.clusterId] = {
                'marker': marker,
                'meta': meta
            };
            google.maps.event.addListener(marker, 'dblclick', function () {
                var newZoom = meta.maxZoomLevel + 1;
                map.setCenter(location);
                map.setZoom(newZoom);
            });
            return marker;
        };
        validateSearchInput = function (searchstring) {
            if (searchstring !== "") {
                return searchstring;
            }
            return null;
        };
        var bindEventListeners = function () {
            google.maps.event.addListener(map, 'dragend', function () {
                if (lastCenter !== undefined && lastCenter !== locatorCoreClosure.getMap().getCenter() &&
                    inDirectionsMode === false && inFilteredMode === false) {
                    getVisibleLocations();
                    lastCenter = locatorCoreClosure.getMap().getCenter();
                }
            });
            google.maps.event.addListener(map, 'idle', function () {
                if (locatorCoreClosure.getMap().getZoom() !== lastZoom) {
                    logDebug("Zoom changed " + locatorCoreClosure.getMap().getZoom() +
                        "!==" + lastZoom + " newSearch: " + newSearch);
                    if (newSearch === false && inDirectionsMode === false && inFilteredMode === false) {
                        getVisibleLocations();
                    }
                    newSearch = false;
                    lastZoom = locatorCoreClosure.getMap().getZoom();
                }
            });
        };
        redrawResultsComplete = function () {
            google.maps.event.trigger(locatorCoreClosure.getMap(), 'resize');
            $('#' + coreSettings.mapId)
                .trigger(locatorCoreEventNamespace + 'redrawResultsComplete');
        };
        var highlightMarker = function (marker, excludeOthers) {
            var location, icon;
            if (isDefined(marker)) {
                if (lastSelectedMarker) {
                    if (marker.markerId === lastSelectedMarker.markerId && !excludeOthers) {
                        return;
                    }
                    unhighlightMarker(lastSelectedMarker);
                }
                lastSelectedMarker = marker;
                location = locatorCoreClosure.getSelectedLocation(marker.markerId);
                icon = getMarkerIcon(location.meta, true);
                marker.setIcon(null);
                marker.setIcon(icon);
                marker.setZIndex(10);
                marker.label.span.className = labelHighlightClassName;
                if (isDefined(excludeOthers)) {
                    redrawExcludeOthers = excludeOthers;
                    redrawResults(searchResults, redrawResultsComplete, excludeOthers);
                }
                $('#' + coreSettings.mapId)
                    .trigger(locatorCoreEventNamespace + 'highlightMarker', [marker.markerId]);
            }
        };
        unhighlightMarker = function (marker) {
            var location, icon;
            if (isDefined(marker)) {
                location = locatorCoreClosure.getSelectedLocation(marker.markerId);
                icon = getMarkerIcon(location.meta, false);
                marker.setIcon(icon);
                marker.setZIndex(0);
                marker.label.span.className = labelClassName;
                lastSelectedMarker = null;
                if (redrawExcludeOthers) {
                    redrawExcludeOthers = false;
                    redrawResults();
                }
                $('#' + coreSettings.mapId)
                    .trigger(locatorCoreEventNamespace + 'unhighlightMarker', [marker.markerId]);
            }
        };
        var searchAddress = function (searchString) {
            var def = $.Deferred();
            var search = sanitizeString(searchString);
            if (!validateBsb(search) && searchString.length > 0) {
                return resolveAddress(search)
                    .done(function (data) {
                    if (data.list) {
                        processSearchData(data);
                    }

                    def.resolve(data);
                }).fail(function (err) {
                    setStatusText(err.errors[0].text);
                    def.reject(err.errors[0].data);
                });
            }

            return def.promise();
        };
        var searchBSB = function (searchString) {
            var search = sanitizeString(searchString);
            var def = $.Deferred();
            if (validateBsb(search) && searchString.length > 0) {
                return resolveBsb(search)
                    .done(function (data) {
                    processSearchData(data);
                    def.resolve(data);
                })
                    .fail(function (err) {
                    setStatusText(err.errors[0].text);
                    def.reject(err);
                });
            }
            else {
                return def.reject({
                    "errors": [{ "text": "Could not find BSB [" + searchString + "]" }]
                });
            }
        };
        var getTravelModeDurations = function (myLocation) {
            var i, deferred = $.Deferred(), sendRequest, serviceFailure, requestPromise, request = {
                unitSystem: google.maps.UnitSystem.METRIC
            }, processResponse, destinations = [], result = { list: [] };
            for (i = 0; i < searchResults.length; i++) {
                if (searchResults[i].marker) {
                    destinations.push(searchResults[i].marker.getPosition());
                }
            }
            request.destinations = destinations;
            request.origins = [myLocation];
            sendRequest = function (travelMode) {
                requestPromise = $.Deferred();
                request.travelMode = travelMode;
                distanceMatrixService.getDistanceMatrix(request, function (response, status) {
                    processResponse(travelMode, response, status);
                });
                return requestPromise.promise();
            };
            serviceFailure = function (status) {
                deferred.reject({
                    "errors": [{
                            "text": "Distance matrix service error: " +
                                google.maps.DistanceMatrixStatus[status]
                        }]
                });
            };
            processResponse = function (travelMode, response, status) {
                var value, j;
                if (status === google.maps.DistanceMatrixStatus.OK) {
                    for (j = 0; j < response.rows[0].elements.length; j++) {
                        value = response.rows[0].elements[j].status === google.maps.DistanceMatrixElementStatus.OK ?
                            response.rows[0].elements[j].duration.text : 'Undetermined';
                        searchResults[j].meta.duration[travelMode] = value;
                    }
                    requestPromise.resolve(status);
                }
                else {
                    requestPromise.reject(status);
                }
            };
            sendRequest(google.maps.TravelMode.WALKING)
                .then(function () {
                sendRequest(google.maps.TravelMode.DRIVING)
                    .then(function () {
                    sendRequest(google.maps.TravelMode.TRANSIT)
                        .then(function () {
                        for (i = 0; i < searchResults.length; i++) {
                            result.list.push(searchResults[i].meta);
                        }
                        deferred.resolve(result);
                    }, serviceFailure);
                }, serviceFailure);
            }, serviceFailure);
            return deferred.promise();
        };
        locatorCoreClosure = {
            getMap: function () {
                return map;
            },
            getSearchData: function (searchUrl, options) {
                return getSearchData(searchUrl, options);
            },
            updateInfoWindow: function (html) {
                if (infowindow) {
                    var infoWindowPosition = infowindow.getPosition();
                    infowindow.setContent(html);
                    infowindow.setPosition(infoWindowPosition);
                    infowindow.open(map);
                }
            },
            formatPhoneNumber: function (phoneNumber) {
                return formatPhoneNumber(phoneNumber);
            },
            servicePath: function (path) {
                if (path !== undefined) {
                    coreSettings.servicePath = path;
                }
                else {
                    return (coreSettings.servicePath !== undefined) ? coreSettings.servicePath : locatorURL;
                }
            },
            imagePath: function (path) {
                if (path !== undefined) {
                    coreSettings.imagePath = path;
                }
                else {
                    return (coreSettings.imagePath !== undefined) ? coreSettings.imagePath : imageURL;
                }
            },
            basePath: function (path) {
                if (path !== undefined) {
                    coreSettings.basePath = path;
                }
                else {
                    return (coreSettings.basePath !== undefined) ? coreSettings.basePath : baseUrl;
                }
            },
            statusText: function (text) {
                if (text !== undefined) {
                    coreSettings.statusText = text;
                }
                else {
                    return (coreSettings.statusText !== undefined) ? coreSettings.statusText : "idle";
                }
            },
            mapCanvas: function (mapId) {
                if (mapId !== undefined) {
                    coreSettings.mapId = mapId;
                }
                else {
                    return (coreSettings.mapId !== undefined) ?
                        document.getElementById(coreSettings.mapId) : null;
                }
            },
            searchType: function (searchtype) {
                if (searchtype !== undefined) {
                    coreSettings.searchType = searchtype;
                }
                else {
                    return (coreSettings.searchType !== undefined) ? coreSettings.searchType : "findByLocation";
                }
            },
            searchFilterString: function (searchfilters) {
                if (searchfilters !== undefined) {
                    coreSettings.searchFilterString = searchfilters;
                }
                else {
                    return (coreSettings.searchFilterString !== undefined) ? coreSettings.searchFilterString : "";
                }
            },
            maxSearchLimit: function (limit) {
                if (limit !== undefined) {
                    coreSettings.maxSearchLimit = limit;
                }
                else {
                    return (coreSettings.maxSearchLimit !== undefined) ? coreSettings.maxSearchLimit : maxSearchLimit;
                }
            },
            isMapLoaded: function () {
                return (window.google &&
                    window.google.maps) ? true : false;
            },
            enableCluster: function (bol) {
                if (bol !== undefined) {
                    coreSettings.enableCluster = bol;
                }
                else {
                    return (coreSettings.enableCluster) ? coreSettings.enableCluster : false;
                }
            },
            enableInfoWindow: function (bol) {
                if (bol !== undefined) {
                    coreSettings.enableInfoWindow = bol;
                }
                else {
                    return (coreSettings.enableInfoWindow) ? coreSettings.enableInfoWindow : false;
                }
            },
            geocodeOnly: function (bol) {
                if (bol !== undefined) {
                    coreSettings.geocodeOnly = bol;
                }
                else {
                    return (coreSettings.geocodeOnly) ? coreSettings.geocodeOnly : false;
                }
            },
            getSelectedLocation: function (markerPointId) {
                if (searchResults) {
                    var index = getSearchResultsIndex(markerPointId);
                    if (index >= 0) {
                        return searchResults[index];
                    }
                }
                return null;
            },
            getLocationAddress: function () {
                var deferred = $.Deferred(), ERROR_MESSAGE = "Sorry, location services are not enabled. Please enable your location service and try again.";
                var getAddress = function () {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function (position) {
                            geocoder.geocode({
                                "location": new google.maps.LatLng(position.coords.latitude, position.coords.longitude)
                            }, function (result, status) {
                                if (status === google.maps.GeocoderStatus.OK) {
                                    if (result && result.length > 0) {
                                        deferred.resolve(result[0].formatted_address);
                                    }
                                }
                                else {
                                    setStatusText(ERROR_MESSAGE);
                                    deferred.reject({ "errors": [{ "text": ERROR_MESSAGE }] });
                                }
                            });
                        }, function () {
                            setStatusText(ERROR_MESSAGE);
                            deferred.reject(ERROR_MESSAGE);
                        }, {
                            maximumAge: 0
                        });
                    }
                };
                if (!locatorCoreClosure.isMapLoaded()) {
                    initialiseComplete.done(function () {
                        getAddress();
                    });
                }
                else {
                    getAddress();
                }
                return deferred.promise();
            },
            searchGeoLocations: function () {
                var deferred = $.Deferred(), promises = [], msg, searchFn;
                searchFn = function () {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(function (position) {
                            var getLocationAddress = function (latLng) {
                                var addressDef = $.Deferred();
                                geocoder.geocode({
                                    "location": latLng
                                }, function (result, status) {
                                    if (status === google.maps.GeocoderStatus.OK) {
                                        if (result && result.length > 0) {
                                            addressDef.resolve(result[0].formatted_address);
                                        }
                                    }
                                    else {
                                        addressDef.resolve("");
                                    }
                                });
                                return addressDef.promise();
                            };
                            var findLocations = function (latLng) {
                                var searchDef = $.Deferred();
                                findLocationsNear(latLng).done(function (data) {
                                    processSearchData(data);
                                    searchDef.resolve(data);
                                });
                                return searchDef.promise();
                            };
                            resetSearch();
                            setStatusText('Getting your location...');
                            var pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                            promises.push(getLocationAddress(pos));
                            promises.push(findLocations(pos));
                            $.when.apply($, promises).then(function (adrs, nearestLocations) {
                                var nearestLocationResponse = {
                                    address: adrs,
                                    locations: nearestLocations
                                };
                                deferred.resolve(nearestLocationResponse);
                            });
                        }, function () {
                            msg = 'Sorry, location services are not enabled. Please enable your location service and try again.';
                            setStatusText(msg);
                            deferred.reject({ "errors": [{ "text": msg }] });
                        });
                    }
                };
                if (!locatorCoreClosure.isMapLoaded()) {
                    initialiseComplete.done(function () {
                        searchFn();
                    });
                }
                else {
                    searchFn();
                }
                return deferred.promise();
            },
            searchLocations: function (searchString) {
                var msg = 'Please enter a search criteria.';
                resetSearch();
                if (isDefined(searchString) && searchString.length > 0) {
                    if (!validateBsb(searchString)) {
                        return searchAddress(searchString);
                    }
                    else {
                        return searchBSB(searchString);
                    }
                }
                else {
                    setStatusText(msg);
                    return $.Deferred().reject({ "errors": [{ "text": msg }] });
                }
            },
            searchAddressSilent: function (searchString) {
                var search = sanitizeString(searchString);
                resetSearch();
                if (!validateBsb(search) && searchString.length > 0) {
                    return resolveAddress(search)
                        .done(function (data) {
                        processSearchData(data);
                    });
                }
            },
            highlightMarker: function (markerPointId, excludeOthers) {
                var marker = locatorCoreClosure.getSelectedLocation(markerPointId);
                if (isDefined(marker)) {
                    highlightMarker(marker.marker, excludeOthers);
                }
            },
            drawLabels: function () {
                lastSelectedMarker = null;
                redrawResults(searchResults, redrawResultsComplete);
            },
            unhighlightAllMarkers: function () {
                lastSelectedMarker = null;
                redrawExcludeOthers = false;
                deleteAllOverlays(mapMarkers.search);
                for (var i = 0, len = searchResults.length; i < len; i++) {
                    unhighlightMarker(searchResults[i].marker);
                }
            },
            unhighlightMarker: function () {
                if (lastSelectedMarker) {
                    unhighlightMarker(lastSelectedMarker);
                }
            },
            markerClickCallback: function (callbackFunction) {
                if (!callbackFunction) {
                    return;
                }
                markerClickCbFuntion = callbackFunction;
            },
            templateResults: function(templateString) {
                if(templateString != undefined) {
                    coreSettings.templateResults = templateString;
                } else {
                    return(coreSettings.templateResults != undefined) ? coreSettings.templateResults : "Results Template";
                }
            },            
            showInfoWindow: function (markerPointId, html, center) {
                var marker = locatorCoreClosure.getSelectedLocation(markerPointId).marker;
                alert("You clicked on --> " + markerPointId);
            },
            getVisibleLocations: function () {
                return getVisibleLocations();
            },
            mapHide: function () {
                $(locatorCoreClosure.mapCanvas()).css({
                    'position': 'absolute',
                    'left': '10000em',
                    'display': 'block'
                }).parent().css({
                    'position': 'relative',
                    'overflow-x': 'hidden'
                });
            },
            mapShow: function () {
                $(locatorCoreClosure.mapCanvas()).css({
                    'position': 'relative',
                    'left': '0em',
                    'display': 'block'
                }).parent().css({
                    'position': 'relative',
                    'overflow-x': 'hidden'
                });
                google.maps.event.trigger(locatorCoreClosure.getMap(), 'resize');
            },
            calculateTravelDurations: function (myLocation) {
                var deferred = $.Deferred(), pos = myLocation, msg, requestTravelModeDurations, geolocationDisabled;
                requestTravelModeDurations = function (location) {
                    getTravelModeDurations(location)
                        .done(function (data) {
                        deferred.resolve(data);
                    })
                        .fail(function () {
                        msg = 'Sorry, could not determine branch/ATM distances.';
                        setStatusText(msg);
                        deferred.reject({ "errors": [{ "text": msg }] });
                    });
                };
                geolocationDisabled = function () {
                    msg = 'Sorry, geolocation is not enabled. Please enable geolocation and try again.';
                    setStatusText(msg);
                    deferred.reject({ "errors": [{ "text": msg }] });
                };
                if (isDefined(pos)) {
                    requestTravelModeDurations(pos);
                }
                else {
                    if (navigator.geolocation) {
                        setStatusText('Getting your location...');
                        navigator.geolocation.getCurrentPosition(function (position) {
                            pos = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                            if (isDefined(pos)) {
                                requestTravelModeDurations(pos);
                            }
                            else {
                                geolocationDisabled();
                            }
                        });
                    }
                    else {
                        geolocationDisabled();
                    }
                }
                return deferred.promise();
            },
            getDirectionsLink: function (travelMode, markerPointId, myLocation) {
                var travelModeParams = {
                    "DRIVING": "/data=!4m2!4m1!3e0",
                    "WALKING": "/data=!4m2!4m1!3e2",
                    "TRANSIT": "/data=!4m2!4m1!3e3"
                }, to, from = 'Current+Location';
                if (!travelModeParams.hasOwnProperty(google.maps.TravelMode[travelMode])) {
                    throw 'getDirectionsLink travelMode ' + travelMode + ' not found';
                }
                to = locatorCoreClosure.getSelectedLocation(markerPointId).marker.getPosition().toUrlValue();
                if (isDefined(myLocation)) {
                    from = myLocation.toUrlValue();
                }
                return gmapsDirectionsUrl + from + '/' + to + travelModeParams[travelMode];
            },
            resize: function () {
                resize();
            },
            initializeMap: function (latitude, longitude, options) {
                var lat = latitude || -28.116801586874008;
                var lng = longitude || 135.65065310000003;
                mapOptions = {
                    zoom: lastZoom,
                    minZoom: minZoom,
                    mapTypeId: google.maps.MapTypeId.ROADMAP,
                    streetViewControl: false
                };
                $.extend(mapOptions, options);
                MarkerLabel.prototype = $.extend(new google.maps.OverlayView(), {
                    onAdd: function () {
                        this.getPanes().overlayImage.appendChild(this.span);
                        var self = this;
                        this.listeners = [
                            google.maps.event.addListener(this, 'position_changed', function () {
                                self.draw();
                            })];
                    },
                    onRemove: function () {
                        if (this.span) {
                            this.text = "";
                            if (this.span["parentNode"])
                                this.span.parentNode.removeChild(this.span);
                            if (this.span["parentElement"])
                                this.span.parentElement.removeChild(this.span);
                        }
                        if (this["listeners"] && $.isArray(this.listeners)) {
                            for (var i = 0, len = this.listeners.length; i < len; i++) {
                                google.maps.event.removeListener(this.listeners[i]);
                            }
                        }
                    },
                    draw: function () {
                        var markerSize = { x: 20, y: 20 }, position = this.getProjection().fromLatLngToDivPixel(this.get('position'));
                        this.span.innerHTML = String(this.get('text'));
                        this.span.style.left = position.x + (markerSize.x / 2) + 5 + 'px';
                        this.span.style.top = position.y - (markerSize.y / 2) + 'px';
                    }
                });
                google.maps.Marker.prototype.setLabel = function (label) {
                    this.label = new MarkerLabel({
                        map: this.map,
                        marker: this,
                        text: label
                    });
                    this.label.bindTo('position', this, 'position');
                };
                createIcons();
                geocoder = new google.maps.Geocoder();
                map = new google.maps.Map(document.getElementById(coreSettings.mapId), mapOptions);
                locatorCoreClosure.getMap().setCenter(new google.maps.LatLng(lat, lng));
                locatorCoreClosure.getMap().setZoom(mapOptions.zoom);
                distanceMatrixService = new google.maps.DistanceMatrixService();
                bindEventListeners();
                initialiseComplete
                    .resolve(locatorCoreClosure.geocodeOnly() ? 'geocodeOnly mode' : 'map mode');
            },
            initialize: function (settings, callback) {
                if (settings) {
                    /*if (settings.gmapsChannel === undefined) {
                        settings.gmapsChannel = location.host + location.pathname;
                    }*/
                    $.extend(coreSettings, settings);
                }
                if (locatorCoreClosure.geocodeOnly()) {
                    logDebug('core.initialize geocodeOnly mode. Callback: ' + callback);
                    var fn;
                    if (isDefined(callback)) {

                        if (typeof callback === 'string'){
                            if (window[callback]) {
                                fn = window[callback];
                            }
                            else {
                                var ns = callback.split('.');
                                fn = window[ns[0]][ns[1]][ns[2]];
                            }
                        }
                        else if (typeof callback === 'function'){
                            fn = callback;
                        }


                        if (typeof fn === 'function') {
                            fn();
                        }
                    }
                }
                else {
                    logDebug('core.initialize map mode.');
                    var cb = callback || "wg.locator.initializeMap";
                    gmapsUrl += '&callback=' + cb;
                    if (coreSettings.gmapsVersion) {
                        gmapsUrl += '&v=' + coreSettings.gmapsVersion;
                    }
                    /*if (coreSettings.gmapsChannel) {
                        gmapsUrl += '&channel=' + coreSettings.gmapsChannel;
                    }*/
                    if (!coreSettings.debug) {
                        gmapsUrl += '&client=gme-westpac';
                    }
                    $.getScript(gmapsUrl);
                }
                return initialiseComplete.promise();
            }
        };
        return locatorCoreClosure;
    }
    return locatorCore;
});
