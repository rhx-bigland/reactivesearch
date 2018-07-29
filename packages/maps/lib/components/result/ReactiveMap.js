'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _reactGoogleMaps = require('react-google-maps');

var _MarkerClusterer = require('react-google-maps/lib/components/addons/MarkerClusterer');

var _MarkerClusterer2 = _interopRequireDefault(_MarkerClusterer);

var _MarkerWithLabel = require('react-google-maps/lib/components/addons/MarkerWithLabel');

var _actions = require('@appbaseio/reactivecore/lib/actions');

var _helper = require('@appbaseio/reactivecore/lib/utils/helper');

var _types = require('@appbaseio/reactivecore/lib/utils/types');

var _types2 = _interopRequireDefault(_types);

var _Dropdown = require('@appbaseio/reactivesearch/lib/components/shared/Dropdown');

var _Dropdown2 = _interopRequireDefault(_Dropdown);

var _utils = require('@appbaseio/reactivesearch/lib/utils');

var _Pagination = require('@appbaseio/reactivesearch/lib/components/result/addons/Pagination');

var _Pagination2 = _interopRequireDefault(_Pagination);

var _FormControlList = require('@appbaseio/reactivesearch/lib/styles/FormControlList');

var _MapPin = require('./addons/styles/MapPin');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

function _objectWithoutProperties(obj, keys) { var target = {}; for (var i in obj) { if (keys.indexOf(i) >= 0) continue; if (!Object.prototype.hasOwnProperty.call(obj, i)) continue; target[i] = obj[i]; } return target; }

var Standard = require('./addons/styles/Standard');
var BlueEssence = require('./addons/styles/BlueEssence');
var BlueWater = require('./addons/styles/BlueWater');
var FlatMap = require('./addons/styles/FlatMap');
var LightMonochrome = require('./addons/styles/LightMonochrome');
var MidnightCommander = require('./addons/styles/MidnightCommander');
var UnsaturatedBrowns = require('./addons/styles/UnsaturatedBrowns');

var MAP_CENTER = {
	lat: 37.7749,
	lng: 122.4194
};

var MapComponent = (0, _reactGoogleMaps.withGoogleMap)(function (props) {
	var children = props.children,
	    onMapMounted = props.onMapMounted,
	    allProps = _objectWithoutProperties(props, ['children', 'onMapMounted']);

	return _react2.default.createElement(
		_reactGoogleMaps.GoogleMap,
		_extends({
			ref: onMapMounted
		}, allProps),
		children
	);
});

function getPrecision(a) {
	if (isNaN(a)) return 0; // eslint-disable-line
	var e = 1;
	var p = 0;
	while (Math.round(a * e) / e !== a) {
		e *= 10;p += 1;
	}
	return p;
}

function withDistinctLat(loc, count) {
	var length = getPrecision(loc.lat);
	var noiseFactor = length >= 6 ? 4 : length - 2;
	var suffix = 1 / Math.pow(10, noiseFactor) * count;
	var location = _extends({}, loc, {
		lat: parseFloat((loc.lat + suffix).toFixed(length))
	});
	return location;
}

var ReactiveMap = function (_Component) {
	_inherits(ReactiveMap, _Component);

	function ReactiveMap(props) {
		_classCallCheck(this, ReactiveMap);

		var _this = _possibleConstructorReturn(this, _Component.call(this, props));

		_initialiseProps.call(_this);

		_this.mapStyles = [{ label: 'Standard', value: Standard }, { label: 'Blue Essence', value: BlueEssence }, { label: 'Blue Water', value: BlueWater }, { label: 'Flat Map', value: FlatMap }, { label: 'Light Monochrome', value: LightMonochrome }, { label: 'Midnight Commander', value: MidnightCommander }, { label: 'Unsaturated Browns', value: UnsaturatedBrowns }];

		var currentMapStyle = _this.mapStyles.find(function (style) {
			return style.label === props.defaultMapStyle;
		}) || _this.mapStyles[0];

		_this.state = {
			currentMapStyle: currentMapStyle,
			from: props.currentPage * props.size || 0,
			isLoading: false,
			totalPages: 0,
			currentPage: props.currentPage,
			mapBoxBounds: null,
			searchAsMove: props.searchAsMove,
			zoom: props.defaultZoom,
			openMarkers: {},
			preserveCenter: false,
			markerOnTop: null
		};
		_this.mapRef = null;
		_this.internalComponent = props.componentId + '__internal';
		props.setQueryListener(props.componentId, props.onQueryChange, null);
		return _this;
	}

	ReactiveMap.prototype.componentDidMount = function componentDidMount() {
		this.props.addComponent(this.internalComponent);
		this.props.addComponent(this.props.componentId);

		if (this.props.stream) {
			this.props.setStreaming(this.props.componentId, true);
		}

		var options = (0, _helper.getQueryOptions)(this.props);
		options.from = this.state.from;
		if (this.props.sortBy) {
			var _ref;

			options.sort = [(_ref = {}, _ref[this.props.dataField] = {
				order: this.props.sortBy
			}, _ref)];
		}

		this.defaultQuery = null;
		if (this.props.defaultQuery) {
			this.defaultQuery = this.props.defaultQuery();
			// Override sort query with defaultQuery's sort if defined
			if (this.defaultQuery.sort) {
				options.sort = this.defaultQuery.sort;
			}

			// since we want defaultQuery to be executed anytime
			// map component's query is being executed
			var persistMapQuery = true;
			// no need to forceExecute because setReact() will capture the main query
			// and execute the defaultQuery along with it
			var forceExecute = false;

			this.props.setMapData(this.props.componentId, this.defaultQuery.query, persistMapQuery, forceExecute);
		} else {
			// only apply geo-distance when defaultQuery prop is not set
			var query = this.getGeoDistanceQuery();
			if (query) {
				// - only persist the map query if center prop is set
				// - ideally, persist the map query if you want to keep executing it
				//   whenever there is a change (due to subscription) in the component query
				var _persistMapQuery = !!this.props.center;

				// - forceExecute will make sure that the component query + Map query gets executed
				//   irrespective of the changes in the component query
				// - forceExecute will only come into play when searchAsMove is true
				// - kindly note that forceExecute may result in one additional network request
				//   since it bypasses the gatekeeping
				var _forceExecute = this.state.searchAsMove;
				this.props.setMapData(this.props.componentId, query, _persistMapQuery, _forceExecute);
			}
		}

		this.props.setQueryOptions(this.props.componentId, options, !(this.defaultQuery && this.defaultQuery.query));
		this.setReact(this.props);
	};

	ReactiveMap.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
		if (this.props.sortBy !== nextProps.sortBy || this.props.size !== nextProps.size || !(0, _helper.isEqual)(this.props.dataField, nextProps.dataField)) {
			var options = (0, _helper.getQueryOptions)(nextProps);
			options.from = 0;
			if (nextProps.sortBy) {
				var _ref2;

				options.sort = [(_ref2 = {}, _ref2[nextProps.dataField] = {
					order: nextProps.sortBy
				}, _ref2)];
			}
			this.setState({
				from: 0,
				currentPage: 0
			});
			this.props.setQueryOptions(this.props.componentId, options, true);
		}

		if (!(0, _helper.isEqual)(this.props.center, nextProps.center)) {
			var persistMapQuery = !!nextProps.center;
			// we need to forceExecute the query because the center has changed
			var forceExecute = true;

			this.props.setMapData(this.props.componentId, this.getGeoQuery(nextProps), persistMapQuery, forceExecute);
		}

		if (!(0, _helper.isEqual)(this.props.hits, nextProps.hits)) {
			this.setState({
				openMarkers: {}
			});
		}

		if (nextProps.defaultQuery && !(0, _helper.isEqual)(nextProps.defaultQuery(), this.defaultQuery)) {
			var _options = (0, _helper.getQueryOptions)(nextProps);
			_options.from = this.state.from;
			this.defaultQuery = nextProps.defaultQuery();

			var _defaultQuery = this.defaultQuery,
			    sort = _defaultQuery.sort,
			    query = _defaultQuery.query;


			if (sort) {
				_options.sort = this.defaultQuery.sort;
				nextProps.setQueryOptions(nextProps.componentId, _options, !query);
			}

			var _persistMapQuery2 = true;
			var _forceExecute2 = true;

			this.props.setMapData(this.props.componentId, query, _persistMapQuery2, _forceExecute2);
		}

		if (this.props.stream !== nextProps.stream) {
			this.props.setStreaming(nextProps.componentId, nextProps.stream);
		}

		if (!(0, _helper.isEqual)(nextProps.react, this.props.react)) {
			this.setReact(nextProps);
		}

		// called when page is changed
		if (this.props.pagination && this.state.isLoading) {
			if (nextProps.onPageChange) {
				nextProps.onPageChange();
			}
			this.setState({
				isLoading: false
			});
		}

		if (!nextProps.pagination && this.props.hits && nextProps.hits && (this.props.hits.length < nextProps.hits.length || nextProps.hits.length === nextProps.total)) {
			this.setState({
				isLoading: false
			});
		}

		if (!nextProps.pagination && nextProps.hits && this.props.hits && nextProps.hits.length < this.props.hits.length) {
			if (nextProps.onPageChange) {
				nextProps.onPageChange();
			}
			this.setState({
				from: 0,
				isLoading: false
			});
		}

		if (nextProps.pagination && nextProps.total !== this.props.total) {
			this.setState({
				totalPages: Math.ceil(nextProps.total / nextProps.size),
				currentPage: this.props.total ? 0 : this.state.currentPage
			});
		}

		if (this.props.searchAsMove !== nextProps.searchAsMove) {
			this.setState({
				searchAsMove: nextProps.searchAsMove
			});
			// no need to execute the map query since the component will
			// get re-rendered and the new query will be automatically evaluated
		}

		if (this.props.defaultZoom !== nextProps.defaultZoom && !isNaN(nextProps.defaultZoom) // eslint-disable-line
		&& nextProps.defaultZoom) {
			this.setState({
				zoom: nextProps.defaultZoom
			});
		}

		if (this.props.defaultMapStyle !== nextProps.defaultMapStyle) {
			this.setState({
				currentMapStyle: this.mapStyles.find(function (style) {
					return style.label === nextProps.defaultMapStyle;
				}) || this.mapStyles[0]
			});
		}
	};

	ReactiveMap.prototype.shouldComponentUpdate = function shouldComponentUpdate(nextProps, nextState) {
		if (this.state.searchAsMove !== nextState.searchAsMove || this.state.markerOnTop !== nextState.markerOnTop || this.props.showMapStyles !== nextProps.showMapStyles || this.props.autoCenter !== nextProps.autoCenter || this.props.streamAutoCenter !== nextProps.streamAutoCenter || this.props.defaultZoom !== nextProps.defaultZoom || this.props.showMarkerClusters !== nextProps.showMarkerClusters || !(0, _helper.isEqual)(this.state.currentMapStyle, nextState.currentMapStyle) || !(0, _helper.isEqual)(this.state.openMarkers, nextState.openMarkers)) {
			return true;
		}

		if ((0, _helper.isEqual)(this.props.hits, nextProps.hits) && (0, _helper.isEqual)(this.props.streamHits, nextProps.streamHits)) {
			return false;
		}
		return true;
	};

	ReactiveMap.prototype.componentWillUnmount = function componentWillUnmount() {
		this.props.removeComponent(this.props.componentId);
		this.props.removeComponent(this.internalComponent);
	};

	// getArrPosition = location => [location.lat, location.lon || location.lng];


	ReactiveMap.prototype.parseLocation = function parseLocation(location) {
		if (Array.isArray(location)) {
			return {
				lat: Number(location[0]),
				lng: Number(location[1])
			};
		}
		return {
			lat: location ? Number(location.lat) : this.props.defaultCenter.lat,
			lng: location ? Number(location.lon === undefined ? location.lng : location.lon) : this.props.defaultCenter.lng
		};
	};

	ReactiveMap.prototype.render = function render() {
		var style = {
			width: '100%',
			height: '100vh',
			position: 'relative'
		};

		return _react2.default.createElement(
			'div',
			{ style: _extends({}, style, this.props.style), className: this.props.className },
			this.props.onAllData ? this.props.onAllData((0, _helper.parseHits)(this.props.hits), (0, _helper.parseHits)(this.props.streamHits), this.loadMore, this.renderMap, this.renderPagination) : this.renderMap()
		);
	};

	return ReactiveMap;
}(_react.Component);

var _initialiseProps = function _initialiseProps() {
	var _this2 = this;

	this.setReact = function (props) {
		var react = props.react;

		if (react) {
			var newReact = (0, _helper.pushToAndClause)(react, _this2.internalComponent);
			props.watchComponent(props.componentId, newReact);
		} else {
			props.watchComponent(props.componentId, { and: _this2.internalComponent });
		}
	};

	this.getHitsCenter = function (hits) {
		var data = hits.map(function (hit) {
			return hit[_this2.props.dataField];
		});

		if (data.length) {
			var numCoords = data.length;

			var X = 0.0;
			var Y = 0.0;
			var Z = 0.0;

			data.forEach(function (location) {
				if (location) {
					var _lat = 0.0;
					var _lng = 0.0;

					if (Array.isArray(location)) {
						_lat = location[0] * Math.PI / 180;
						_lng = location[1] * Math.PI / 180;
					} else {
						_lat = location.lat * Math.PI / 180;
						_lng = (location.lng !== undefined ? location.lng : location.lon) * Math.PI / 180;
					}

					var a = Math.cos(_lat) * Math.cos(_lng);
					var b = Math.cos(_lat) * Math.sin(_lng);
					var c = Math.sin(_lat);

					X += a;
					Y += b;
					Z += c;
				}
			});

			X /= numCoords;
			Y /= numCoords;
			Z /= numCoords;

			var lng = Math.atan2(Y, X);
			var hyp = Math.sqrt(X * X + Y * Y);
			var lat = Math.atan2(Z, hyp);

			var newX = lat * 180 / Math.PI;
			var newY = lng * 180 / Math.PI;

			return {
				lat: newX,
				lng: newY
			};
		}
		return false;
	};

	this.getArrPosition = function (location) {
		return { lat: location.lat, lon: location.lon || location.lng };
	};

	this.getGeoDistanceQuery = function () {
		var center = _this2.props.center || _this2.props.defaultCenter;
		if (center && _this2.props.defaultRadius) {
			var _geo_distance;

			// skips geo bounding box query on initial load
			_this2.skipBoundingBox = true;
			return {
				geo_distance: (_geo_distance = {
					distance: '' + _this2.props.defaultRadius + _this2.props.unit
				}, _geo_distance[_this2.props.dataField] = _this2.getArrPosition(center), _geo_distance)
			};
		}
		return null;
	};

	this.getGeoQuery = function () {
		var props = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : _this2.props;

		_this2.defaultQuery = props.defaultQuery ? props.defaultQuery() : null;

		if (_this2.mapRef) {
			var _geo_bounding_box;

			var mapBounds = _this2.mapRef.getBounds();
			var north = mapBounds.getNorthEast().lat();
			var south = mapBounds.getSouthWest().lat();
			var east = mapBounds.getNorthEast().lng();
			var west = mapBounds.getSouthWest().lng();
			var boundingBoxCoordinates = {
				top_left: [west, north],
				bottom_right: [east, south]
			};

			_this2.setState({
				mapBoxBounds: boundingBoxCoordinates
			});

			var geoQuery = {
				geo_bounding_box: (_geo_bounding_box = {}, _geo_bounding_box[_this2.props.dataField] = boundingBoxCoordinates, _geo_bounding_box)
			};

			if (_this2.defaultQuery) {
				var query = _this2.defaultQuery.query;


				if (query) {
					// adds defaultQuery's query to geo-query
					// to generate a map query

					return {
						must: [geoQuery, query]
					};
				}
			}

			return geoQuery;
		}

		// return the defaultQuery (if set) or null when map query not available
		return _this2.defaultQuery ? _this2.defaultQuery.query : null;
	};

	this.setGeoQuery = function () {
		var executeUpdate = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

		// execute a new query on theinitial mount
		// or whenever searchAsMove is true and the map is dragged
		if (executeUpdate || !_this2.skipBoundingBox && !_this2.state.mapBoxBounds) {
			_this2.defaultQuery = _this2.getGeoQuery();

			var persistMapQuery = !!_this2.props.center;
			var forceExecute = _this2.state.searchAsMove;

			_this2.props.setMapData(_this2.props.componentId, _this2.defaultQuery, persistMapQuery, forceExecute);
		}
		_this2.skipBoundingBox = false;
	};

	this.loadMore = function () {
		if (_this2.props.hits && !_this2.props.pagination && _this2.props.total !== _this2.props.hits.length) {
			var value = _this2.state.from + _this2.props.size;
			var options = (0, _helper.getQueryOptions)(_this2.props);

			_this2.setState({
				from: value,
				isLoading: true
			});
			_this2.props.loadMore(_this2.props.componentId, _extends({}, options, {
				from: value
			}), true);
		} else if (_this2.state.isLoading) {
			_this2.setState({
				isLoading: false
			});
		}
	};

	this.setPage = function (page) {
		var value = _this2.props.size * page;
		var options = (0, _helper.getQueryOptions)(_this2.props);
		options.from = _this2.state.from;
		_this2.setState({
			from: value,
			isLoading: true,
			currentPage: page
		});
		_this2.props.loadMore(_this2.props.componentId, _extends({}, options, {
			from: value
		}), false);

		if (_this2.props.URLParams) {
			_this2.props.setPageURL(_this2.props.componentId + '-page', page + 1, _this2.props.componentId + '-page', false, true);
		}
	};

	this.getPosition = function (result) {
		if (result) {
			return _this2.parseLocation(result[_this2.props.dataField]);
		}
		return null;
	};

	this.setMapStyle = function (currentMapStyle) {
		_this2.setState({
			currentMapStyle: currentMapStyle
		});
	};

	this.getCenter = function (hits) {
		if (_this2.props.center) {
			return _this2.parseLocation(_this2.props.center);
		}

		if (!!_this2.mapRef && _this2.state.preserveCenter || _this2.props.stream && _this2.props.streamHits.length && !_this2.props.streamAutoCenter) {
			var currentCenter = _this2.mapRef.getCenter();
			setTimeout(function () {
				_this2.setState({
					preserveCenter: false
				});
			}, 100);
			return _this2.parseLocation({
				lat: currentCenter.lat(),
				lng: currentCenter.lng()
			});
		}

		if (hits && hits.length) {
			if (_this2.props.autoCenter || _this2.props.streamAutoCenter) {
				return _this2.getHitsCenter(hits) || _this2.getDefaultCenter();
			}
			return hits[0] && hits[0][_this2.props.dataField] ? _this2.getPosition(hits[0]) : _this2.getDefaultCenter();
		}
		return _this2.getDefaultCenter();
	};

	this.getDefaultCenter = function () {
		if (_this2.props.defaultCenter) return _this2.parseLocation(_this2.props.defaultCenter);
		return _this2.parseLocation(MAP_CENTER);
	};

	this.handleOnIdle = function () {
		// only make the geo_bounding query if we have hits data
		if (_this2.props.hits.length && _this2.state.searchAsMove) {
			// always execute geo-bounds query when center is set
			// to improve the specificity of search results
			var executeUpdate = !!_this2.props.center;
			_this2.setGeoQuery(executeUpdate);
		}
		if (_this2.props.mapProps.onIdle) _this2.props.mapProps.onIdle();
	};

	this.handleOnDragEnd = function () {
		if (_this2.state.searchAsMove) {
			_this2.setState({
				preserveCenter: true
			}, function () {
				_this2.setGeoQuery(true);
			});
		}
		if (_this2.props.mapProps.onDragEnd) _this2.props.mapProps.onDragEnd();
	};

	this.handleZoomChange = function () {
		var zoom = _this2.mapRef.getZoom();
		if (_this2.state.searchAsMove) {
			_this2.setState({
				zoom: zoom,
				preserveCenter: true
			}, function () {
				_this2.setGeoQuery(true);
			});
		} else {
			_this2.setState({
				zoom: zoom
			});
		}
		if (_this2.props.mapProps.onZoomChanged) _this2.props.mapProps.onZoomChanged();
	};

	this.toggleSearchAsMove = function () {
		_this2.setState({
			searchAsMove: !_this2.state.searchAsMove
		});
	};

	this.renderSearchAsMove = function () {
		if (_this2.props.showSearchAsMove) {
			return _react2.default.createElement(
				'div',
				{
					style: {
						position: 'absolute',
						bottom: 30,
						left: 10,
						width: 240,
						backgroundColor: '#fff',
						padding: '8px 10px',
						boxShadow: 'rgba(0,0,0,0.3) 0px 1px 4px -1px',
						borderRadius: 2
					},
					className: (0, _helper.getClassName)(_this2.props.innerClass, 'checkboxContainer') || null
				},
				_react2.default.createElement(_FormControlList.Checkbox, {
					className: (0, _helper.getClassName)(_this2.props.innerClass, 'checkbox') || null,
					id: 'searchasmove',
					onChange: _this2.toggleSearchAsMove,
					checked: _this2.state.searchAsMove
				}),
				_react2.default.createElement(
					'label',
					{
						className: (0, _helper.getClassName)(_this2.props.innerClass, 'label') || null,
						htmlFor: 'searchasmove'
					},
					'Search as I move the map'
				)
			);
		}

		return null;
	};

	this.openMarkerInfo = function (id) {
		var _extends2;

		_this2.setState({
			openMarkers: _extends({}, _this2.state.openMarkers, (_extends2 = {}, _extends2[id] = true, _extends2)),
			preserveCenter: true
		});
	};

	this.closeMarkerInfo = function (id) {
		var _state$openMarkers = _this2.state.openMarkers,
		    del = _state$openMarkers[id],
		    activeMarkers = _objectWithoutProperties(_state$openMarkers, [id]);

		_this2.setState({
			openMarkers: activeMarkers,
			preserveCenter: true
		});
	};

	this.renderPopover = function (item) {
		var includeExternalSettings = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

		var additionalProps = {};

		if (includeExternalSettings) {
			// to render pop-over correctly with MarkerWithLabel
			additionalProps = {
				position: _this2.getPosition(item),
				defaultOptions: {
					pixelOffset: new window.google.maps.Size(0, -30)
				}
			};
		}

		if (item._id in _this2.state.openMarkers) {
			return _react2.default.createElement(
				_reactGoogleMaps.InfoWindow,
				_extends({
					zIndex: 500,
					key: item._id + '-InfoWindow',
					onCloseClick: function onCloseClick() {
						return _this2.closeMarkerInfo(item._id);
					}
				}, additionalProps),
				_this2.props.onPopoverClick(item)
			);
		}
		return null;
	};

	this.increaseMarkerZIndex = function (id) {
		_this2.setState({
			markerOnTop: id,
			preserveCenter: true
		});
	};

	this.removeMarkerZIndex = function () {
		_this2.setState({
			markerOnTop: null,
			preserveCenter: true
		});
	};

	this.addNoise = function (hits) {
		var hitMap = {};
		var updatedHits = [];

		hits.forEach(function (item) {
			var updatedItem = _extends({}, item);
			var location = _this2.parseLocation(item[_this2.props.dataField]);
			var key = JSON.stringify(location);
			var count = hitMap[key] || 0;

			updatedItem[_this2.props.dataField] = count ? withDistinctLat(location, count) : location;
			updatedHits = [].concat(updatedHits, [updatedItem]);

			hitMap[key] = count + 1;
		});
		return updatedHits;
	};

	this.getMarkers = function (resultsToRender) {
		var markers = [];
		if (_this2.props.showMarkers) {
			markers = resultsToRender.map(function (item) {
				var markerProps = {
					position: _this2.getPosition(item)
				};

				if (_this2.state.markerOnTop === item._id) {
					markerProps.zIndex = window.google.maps.Marker.MAX_ZINDEX + 1;
				}

				if (_this2.props.onData) {
					var data = _this2.props.onData(item);

					if ('label' in data) {
						return _react2.default.createElement(
							_MarkerWithLabel.MarkerWithLabel,
							_extends({
								key: item._id,
								labelAnchor: new window.google.maps.Point(0, 30),
								icon: 'https://i.imgur.com/h81muef.png' // blank png to remove the icon
								, onClick: function onClick() {
									return _this2.openMarkerInfo(item._id);
								},
								onMouseOver: function onMouseOver() {
									return _this2.increaseMarkerZIndex(item._id);
								},
								onFocus: function onFocus() {
									return _this2.increaseMarkerZIndex(item._id);
								},
								onMouseOut: _this2.removeMarkerZIndex,
								onBlur: _this2.removeMarkerZIndex
							}, markerProps, _this2.props.markerProps),
							_react2.default.createElement(
								'div',
								{ className: _MapPin.mapPinWrapper },
								_react2.default.createElement(
									_MapPin.MapPin,
									null,
									data.label
								),
								_react2.default.createElement(_MapPin.MapPinArrow, null),
								_this2.props.onPopoverClick ? _this2.renderPopover(item, true) : null
							)
						);
					} else if ('icon' in data) {
						markerProps.icon = data.icon;
					} else {
						return _react2.default.createElement(
							_MarkerWithLabel.MarkerWithLabel,
							_extends({
								key: item._id,
								labelAnchor: new window.google.maps.Point(0, 0),
								onMouseOver: function onMouseOver() {
									return _this2.increaseMarkerZIndex(item._id);
								},
								onFocus: function onFocus() {
									return _this2.increaseMarkerZIndex(item._id);
								},
								onMouseOut: _this2.removeMarkerZIndex,
								onBlur: _this2.removeMarkerZIndex
							}, markerProps, _this2.props.markerProps),
							data.custom
						);
					}
				} else if (_this2.props.defaultPin) {
					markerProps.icon = _this2.props.defaultPin;
				}

				return _react2.default.createElement(
					_reactGoogleMaps.Marker,
					_extends({
						key: item._id,
						onClick: function onClick() {
							return _this2.openMarkerInfo(item._id);
						}
					}, markerProps, _this2.props.markerProps),
					_this2.props.onPopoverClick ? _this2.renderPopover(item) : null
				);
			});
		}
		return markers;
	};

	this.renderMap = function () {
		var results = (0, _helper.parseHits)(_this2.props.hits) || [];
		var streamResults = (0, _helper.parseHits)(_this2.props.streamHits) || [];
		var filteredResults = results.filter(function (item) {
			return !!item[_this2.props.dataField];
		});

		if (streamResults.length) {
			var ids = streamResults.map(function (item) {
				return item._id;
			});
			filteredResults = filteredResults.filter(function (item) {
				return !ids.includes(item._id);
			});
		}

		var resultsToRender = _this2.addNoise([].concat(streamResults, filteredResults));
		var markers = _this2.getMarkers(resultsToRender);

		var style = {
			width: '100%',
			height: '100%',
			position: 'relative'
		};

		return _react2.default.createElement(
			'div',
			{ style: style },
			_react2.default.createElement(
				MapComponent,
				_extends({
					containerElement: _react2.default.createElement('div', { style: style }),
					mapElement: _react2.default.createElement('div', { style: { height: '100%' } }),
					onMapMounted: function onMapMounted(ref) {
						_this2.mapRef = ref;
						if (_this2.props.innerRef && ref) {
							var map = Object.values(ref.context)[0];
							var mapRef = _extends({}, ref, { map: map });
							_this2.props.innerRef(mapRef);
						}
					},
					zoom: _this2.state.zoom,
					center: _this2.getCenter(resultsToRender)
				}, _this2.props.mapProps, {
					onIdle: _this2.handleOnIdle,
					onZoomChanged: _this2.handleZoomChange,
					onDragEnd: _this2.handleOnDragEnd,
					options: _extends({
						styles: _this2.state.currentMapStyle.value
					}, (0, _helper.getInnerKey)(_this2.props.mapProps, 'options'))
				}),
				_this2.props.showMarkers && _this2.props.showMarkerClusters ? _react2.default.createElement(
					_MarkerClusterer2.default,
					{
						averageCenter: true,
						enableRetinaIcons: true,
						gridSize: 60
					},
					markers
				) : markers,
				_this2.props.showMarkers && _this2.props.markers,
				_this2.renderSearchAsMove()
			),
			_this2.props.showMapStyles ? _react2.default.createElement(
				'div',
				{
					style: {
						position: 'absolute',
						top: 10,
						right: 46,
						width: 120,
						zIndex: window.google.maps.Marker.MAX_ZINDEX + 1
					}
				},
				_react2.default.createElement(_Dropdown2.default, {
					innerClass: _this2.props.innerClass,
					items: _this2.mapStyles,
					onChange: _this2.setMapStyle,
					selectedItem: _this2.state.currentMapStyle,
					keyField: 'label',
					returnsObject: true,
					small: true
				})
			) : null
		);
	};

	this.renderPagination = function () {
		return _react2.default.createElement(_Pagination2.default, {
			pages: _this2.props.pages,
			totalPages: _this2.state.totalPages,
			currentPage: _this2.state.currentPage,
			setPage: _this2.setPage,
			innerClass: _this2.props.innerClass
		});
	};
};

ReactiveMap.propTypes = {
	addComponent: _types2.default.funcRequired,
	setMapData: _types2.default.funcRequired,
	loadMore: _types2.default.funcRequired,
	removeComponent: _types2.default.funcRequired,
	setQueryListener: _types2.default.funcRequired,
	onQueryChange: _types2.default.func,
	setPageURL: _types2.default.func,
	setQueryOptions: _types2.default.funcRequired,
	setStreaming: _types2.default.func,
	updateQuery: _types2.default.funcRequired,
	watchComponent: _types2.default.funcRequired,
	currentPage: _types2.default.number,
	hits: _types2.default.hits,
	isLoading: _types2.default.bool,
	streamHits: _types2.default.hits,
	time: _types2.default.number,
	total: _types2.default.number,
	url: _types2.default.string,
	// component props
	autoCenter: _types2.default.bool,
	center: _types2.default.location,
	className: _types2.default.string,
	componentId: _types2.default.stringRequired,
	dataField: _types2.default.stringRequired,
	defaultCenter: _types2.default.location,
	defaultMapStyle: _types2.default.string,
	defaultPin: _types2.default.string,
	defaultQuery: _types2.default.func,
	defaultZoom: _types2.default.number,
	innerClass: _types2.default.style,
	innerRef: _types2.default.func,
	loader: _types2.default.title,
	mapProps: _types2.default.props,
	markerProps: _types2.default.props,
	markers: _types2.default.children,
	onAllData: _types2.default.func,
	onData: _types2.default.func,
	onPageChange: _types2.default.func,
	onPopoverClick: _types2.default.func,
	pages: _types2.default.number,
	pagination: _types2.default.bool,
	react: _types2.default.react,
	searchAsMove: _types2.default.bool,
	showMapStyles: _types2.default.bool,
	showMarkerClusters: _types2.default.bool,
	showMarkers: _types2.default.bool,
	showSearchAsMove: _types2.default.bool,
	size: _types2.default.number,
	sortBy: _types2.default.sortBy,
	stream: _types2.default.bool,
	streamAutoCenter: _types2.default.bool,
	style: _types2.default.style,
	URLParams: _types2.default.bool,
	defaultRadius: _types2.default.number,
	unit: _types2.default.string
};

ReactiveMap.defaultProps = {
	size: 10,
	style: {},
	className: null,
	pages: 5,
	pagination: false,
	defaultMapStyle: 'Standard',
	autoCenter: false,
	streamAutoCenter: false,
	defaultZoom: 8,
	mapProps: {},
	markerProps: {},
	markers: null,
	showMapStyles: false,
	showSearchAsMove: true,
	searchAsMove: false,
	showMarkers: true,
	showMarkerClusters: true,
	unit: 'mi',
	defaultRadius: 100
};

var mapStateToProps = function mapStateToProps(state, props) {
	return {
		mapKey: state.config.mapKey,
		hits: state.hits[props.componentId] && state.hits[props.componentId].hits || [],
		streamHits: state.streamHits[props.componentId] || [],
		currentPage: state.selectedValues[props.componentId + '-page'] && state.selectedValues[props.componentId + '-page'].value - 1 || 0,
		time: state.hits[props.componentId] && state.hits[props.componentId].time || 0,
		total: state.hits[props.componentId] && state.hits[props.componentId].total
	};
};

var mapDispatchtoProps = function mapDispatchtoProps(dispatch) {
	return {
		addComponent: function addComponent(component) {
			return dispatch((0, _actions.addComponent)(component));
		},
		removeComponent: function removeComponent(component) {
			return dispatch((0, _actions.removeComponent)(component));
		},
		setStreaming: function setStreaming(component, stream) {
			return dispatch((0, _actions.setStreaming)(component, stream));
		},
		watchComponent: function watchComponent(component, react) {
			return dispatch((0, _actions.watchComponent)(component, react));
		},
		setQueryOptions: function setQueryOptions(component, props, execute) {
			return dispatch((0, _actions.setQueryOptions)(component, props, execute));
		},
		setQueryListener: function setQueryListener(component, onQueryChange, beforeQueryChange) {
			return dispatch((0, _actions.setQueryListener)(component, onQueryChange, beforeQueryChange));
		},
		updateQuery: function updateQuery(updateQueryObject) {
			return dispatch((0, _actions.updateQuery)(updateQueryObject));
		},
		loadMore: function loadMore(component, options, append) {
			return dispatch((0, _actions.loadMore)(component, options, append));
		},
		setMapData: function setMapData(component, geoQuery, persistMapQuery) {
			var forceExecute = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : false;
			return dispatch((0, _actions.setMapData)(component, geoQuery, persistMapQuery, forceExecute));
		}
	};
};

exports.default = (0, _utils.connect)(mapStateToProps, mapDispatchtoProps)(ReactiveMap);