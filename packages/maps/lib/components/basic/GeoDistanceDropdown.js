'use strict';

exports.__esModule = true;

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _downshift = require('downshift');

var _downshift2 = _interopRequireDefault(_downshift);

var _emotionTheming = require('emotion-theming');

var _actions = require('@appbaseio/reactivecore/lib/actions');

var _helper = require('@appbaseio/reactivecore/lib/utils/helper');

var _types = require('@appbaseio/reactivecore/lib/utils/types');

var _types2 = _interopRequireDefault(_types);

var _Title = require('@appbaseio/reactivesearch/lib/styles/Title');

var _Title2 = _interopRequireDefault(_Title);

var _Input = require('@appbaseio/reactivesearch/lib/styles/Input');

var _Input2 = _interopRequireDefault(_Input);

var _InputIcon = require('@appbaseio/reactivesearch/lib/styles/InputIcon');

var _InputIcon2 = _interopRequireDefault(_InputIcon);

var _Container = require('@appbaseio/reactivesearch/lib/styles/Container');

var _Container2 = _interopRequireDefault(_Container);

var _SearchSvg = require('@appbaseio/reactivesearch/lib/components/shared/SearchSvg');

var _SearchSvg2 = _interopRequireDefault(_SearchSvg);

var _Dropdown = require('@appbaseio/reactivesearch/lib/components/shared/Dropdown');

var _Dropdown2 = _interopRequireDefault(_Dropdown);

var _utils = require('@appbaseio/reactivesearch/lib/utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var GeoDistanceDropdown = function (_Component) {
	_inherits(GeoDistanceDropdown, _Component);

	function GeoDistanceDropdown(props) {
		_classCallCheck(this, GeoDistanceDropdown);

		var _this = _possibleConstructorReturn(this, _Component.call(this, props));

		_initialiseProps.call(_this);

		_this.state = {
			currentLocation: null,
			currentDistance: 0,
			userLocation: null,
			suggestions: [],
			isOpen: false
		};
		_this.type = 'geo_distance';
		_this.locked = false;
		_this.coordinates = null;
		_this.autocompleteService = null;

		if (props.autoLocation) {
			_this.getUserLocation();
		}
		props.setQueryListener(props.componentId, props.onQueryChange, null);
		return _this;
	}

	GeoDistanceDropdown.prototype.componentWillMount = function componentWillMount() {
		var _this2 = this;

		this.props.addComponent(this.props.componentId);
		this.setReact(this.props);

		if (this.props.selectedValue) {
			this.setState({
				currentLocation: this.props.selectedValue.location
			});
			this.getCoordinates(this.props.selectedValue.location, function () {
				var selected = _this2.props.data.find(function (item) {
					return item.label === _this2.props.selectedValue.label;
				});
				_this2.setDistance(selected.distance);
			});
		} else if (this.props.defaultSelected) {
			this.setState({
				currentLocation: this.props.defaultSelected.location
			});
			this.getCoordinates(this.props.defaultSelected.location, function () {
				var selected = _this2.props.data.find(function (item) {
					return item.label === _this2.props.defaultSelected.label;
				});
				_this2.setDistance(selected.distance);
			});
		}
	};

	GeoDistanceDropdown.prototype.componentDidMount = function componentDidMount() {
		this.autocompleteService = new window.google.maps.places.AutocompleteService();
	};

	GeoDistanceDropdown.prototype.componentWillReceiveProps = function componentWillReceiveProps(nextProps) {
		var _this3 = this;

		(0, _helper.checkPropChange)(this.props.react, nextProps.react, function () {
			return _this3.setReact(nextProps);
		});

		(0, _helper.checkPropChange)(this.props.dataField, nextProps.dataField, function () {
			_this3.updateQuery(_this3.state.currentDistance, nextProps);
		});

		if (nextProps.defaultSelected && nextProps.defaultSelected.label && nextProps.defaultSelected.location && !(0, _helper.isEqual)(this.props.defaultSelected, nextProps.defaultSelected)) {
			this.setValues(nextProps.defaultSelected, nextProps);
		} else if (nextProps.selectedValue && nextProps.selectedValue.label && nextProps.selectedValue.location && !(0, _helper.isEqual)(this.state.currentLocation, nextProps.selectedValue.location)) {
			this.setValues(nextProps.selectedValue, nextProps);
		} else if (!(0, _helper.isEqual)(this.props.selectedValue, nextProps.selectedValue) && !nextProps.selectedValue) {
			this.setState({
				currentLocation: null,
				currentDistance: null
			}, function () {
				_this3.updateQuery(null);
			});
		}
	};

	GeoDistanceDropdown.prototype.componentWillUnmount = function componentWillUnmount() {
		this.props.removeComponent(this.props.componentId);
	};

	GeoDistanceDropdown.prototype.setReact = function setReact(props) {
		if (props.react) {
			props.watchComponent(props.componentId, props.react);
		}
	};

	GeoDistanceDropdown.prototype.getUserLocation = function getUserLocation() {
		var _this4 = this;

		navigator.geolocation.getCurrentPosition(function (location) {
			var coordinates = location.coords.latitude + ', ' + location.coords.longitude;

			fetch('https://maps.googleapis.com/maps/api/geocode/json?key=' + _this4.props.mapKey + '&v=3.31&latlng=' + coordinates).then(function (res) {
				return res.json();
			}).then(function (res) {
				if (Array.isArray(res.results) && res.results.length) {
					var userLocation = res.results[0].formatted_address;
					_this4.setState({
						userLocation: userLocation
					});
				}
			}).catch(function (e) {
				console.error(e);
			});
		});
	};

	GeoDistanceDropdown.prototype.getCoordinates = function getCoordinates(value, cb) {
		var _this5 = this;

		if (value) {
			fetch('https://maps.googleapis.com/maps/api/geocode/json?key=' + this.props.mapKey + '&v=3.31&address=' + value).then(function (res) {
				return res.json();
			}).then(function (res) {
				if (Array.isArray(res.results) && res.results.length) {
					var location = res.results[0].geometry.location;

					_this5.coordinates = location.lat + ', ' + location.lng;
				}
			}).then(function () {
				if (cb) cb();
			}).catch(function (e) {
				console.error(e);
			});
		}
	};

	GeoDistanceDropdown.prototype.render = function render() {
		return _react2.default.createElement(
			_Container2.default,
			{ style: this.props.style, className: this.props.className },
			this.props.title && _react2.default.createElement(
				_Title2.default,
				{ className: (0, _helper.getClassName)(this.props.innerClass, 'title') || null },
				this.props.title
			),
			this.renderSearchBox(),
			_react2.default.createElement(_Dropdown2.default, {
				innerClass: this.props.innerClass,
				items: this.props.data,
				onChange: this.onDistanceChange,
				selectedItem: this.getSelectedLabel(this.state.currentDistance),
				placeholder: 'Select distance',
				keyField: 'label',
				returnsObject: true,
				themePreset: this.props.themePreset
			})
		);
	};

	return GeoDistanceDropdown;
}(_react.Component);

var _initialiseProps = function _initialiseProps() {
	var _this6 = this;

	this.setValues = function (selected, props) {
		_this6.setState({
			currentLocation: selected.location
		});
		_this6.getCoordinates(selected.location, function () {
			var selectedDistance = props.data.find(function (item) {
				return item.label === selected.label;
			});
			_this6.setDistance(selectedDistance.distance);
		});
	};

	this.defaultQuery = function (coordinates, distance, props) {
		if (coordinates && distance) {
			var _this6$type, _ref;

			return _ref = {}, _ref[_this6.type] = (_this6$type = {
				distance: '' + distance + props.unit
			}, _this6$type[props.dataField] = coordinates, _this6$type), _ref;
		}
		return null;
	};

	this.getSelectedLabel = function (distance) {
		return _this6.props.data.find(function (item) {
			return item.distance === distance;
		});
	};

	this.setLocation = function (currentValue) {
		var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this6.props;

		// ignore state updates when component is locked
		if (props.beforeValueChange && _this6.locked) {
			return;
		}

		_this6.locked = true;

		var performUpdate = function performUpdate() {
			_this6.setState({
				currentLocation: currentValue.value,
				isOpen: false
			}, function () {
				_this6.getCoordinates(currentValue.value, function () {
					if (_this6.state.currentDistance) {
						_this6.updateQuery(_this6.state.currentDistance);
						if (props.onValueChange) {
							props.onValueChange({
								label: _this6.getSelectedLabel(_this6.state.currentDistance),
								location: currentValue.value
							});
						}
					}
					_this6.locked = false;
				});
			});
		};

		(0, _helper.checkValueChange)(props.componentId, { label: _this6.getSelectedLabel(_this6.state.currentDistance), location: currentValue.value }, props.beforeValueChange, performUpdate);
	};

	this.setDistance = function (currentDistance) {
		_this6.setState({
			currentDistance: currentDistance
		}, function () {
			_this6.updateQuery(currentDistance, _this6.props);
		});
	};

	this.updateQuery = function (distance) {
		var props = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : _this6.props;

		var query = props.customQuery || _this6.defaultQuery;
		var selectedDistance = _this6.getSelectedLabel(distance);
		var value = null;
		if (selectedDistance) {
			value = {
				label: selectedDistance.label,
				location: _this6.state.currentLocation
			};
		}

		props.updateQuery({
			componentId: props.componentId,
			query: query(_this6.coordinates, distance, props),
			value: value,
			label: props.filterLabel,
			showFilter: props.showFilter,
			URLParams: props.URLParams
		});
	};

	this.renderIcon = function () {
		if (_this6.props.showIcon) {
			return _this6.props.icon || _react2.default.createElement(_SearchSvg2.default, null);
		}
		return null;
	};

	this.onDistanceChange = function (value) {
		_this6.setDistance(value.distance);
	};

	this.onInputChange = function (e) {
		var value = e.target.value;

		_this6.setState({
			currentLocation: value
		});
		if (value.trim()) {
			if (!_this6.autocompleteService) {
				_this6.autocompleteService = new window.google.maps.places.AutocompleteService();
			}

			_this6.autocompleteService.getPlacePredictions({ input: value }, function (res) {
				var suggestionsList = res && res.map(function (place) {
					return {
						label: place.description,
						value: place.description
					};
				}) || [];

				_this6.setState({
					suggestions: suggestionsList
				});
			});
		} else {
			_this6.setState({
				suggestions: []
			});
		}
	};

	this.handleFocus = function (event) {
		_this6.setState({
			isOpen: true
		});
		if (_this6.props.onFocus) {
			_this6.props.onFocus(event);
		}
	};

	this.handleOuterClick = function () {
		_this6.setLocation({ value: _this6.state.currentLocation });
	};

	this.handleStateChange = function (changes) {
		var isOpen = changes.isOpen,
		    type = changes.type;

		if (type === _downshift2.default.stateChangeTypes.mouseUp) {
			_this6.setState({
				isOpen: isOpen
			});
		}
	};

	this.renderSearchBox = function () {
		var suggestionsList = [].concat(_this6.state.suggestions);
		var _props = _this6.props,
		    theme = _props.theme,
		    themePreset = _props.themePreset;


		if (_this6.state.userLocation) {
			suggestionsList = [{
				label: 'Use my current location',
				value: _this6.state.userLocation
			}].concat(_this6.state.suggestions);
		}

		return _react2.default.createElement(_downshift2.default, {
			onChange: _this6.setLocation,
			onOuterClick: _this6.handleOuterClick,
			onStateChange: _this6.handleStateChange,
			isOpen: _this6.state.isOpen,
			itemToString: function itemToString(i) {
				return i;
			},
			render: function render(_ref2) {
				var getInputProps = _ref2.getInputProps,
				    getItemProps = _ref2.getItemProps,
				    isOpen = _ref2.isOpen,
				    highlightedIndex = _ref2.highlightedIndex;
				return _react2.default.createElement(
					'div',
					{ className: _Input.suggestionsContainer },
					_react2.default.createElement(_Input2.default, _extends({
						showIcon: _this6.props.showIcon,
						iconPosition: _this6.props.iconPosition,
						innerRef: _this6.props.innerRef
					}, getInputProps({
						className: (0, _helper.getClassName)(_this6.props.innerClass, 'input'),
						placeholder: _this6.props.placeholder,
						value: _this6.state.currentLocation || '',
						onChange: _this6.onInputChange,
						onBlur: _this6.props.onBlur,
						onFocus: _this6.handleFocus,
						onKeyPress: _this6.props.onKeyPress,
						onKeyDown: _this6.handleKeyDown,
						onKeyUp: _this6.props.onKeyUp
					}), {
						themePreset: themePreset
					})),
					_react2.default.createElement(
						_InputIcon2.default,
						{ iconPosition: _this6.props.iconPosition },
						_this6.renderIcon()
					),
					isOpen && _this6.state.suggestions.length ? _react2.default.createElement(
						'ul',
						{ className: (0, _Input.suggestions)(themePreset, theme) + ' ' + (0, _helper.getClassName)(_this6.props.innerClass, 'list') },
						suggestionsList.slice(0, 11).map(function (item, index) {
							return _react2.default.createElement(
								'li',
								_extends({}, getItemProps({ item: item }), {
									key: item.label,
									style: {
										backgroundColor: highlightedIndex === index ? '#eee' : '#fff'
									}
								}),
								typeof item.label === 'string' ? _react2.default.createElement('div', {
									className: 'trim',
									dangerouslySetInnerHTML: {
										__html: item.label
									}
								}) : item.label
							);
						})
					) : null
				);
			}
		});
	};
};

GeoDistanceDropdown.propTypes = {
	addComponent: _types2.default.funcRequired,
	mapKey: _types2.default.stringRequired,
	removeComponent: _types2.default.funcRequired,
	selectedValue: _types2.default.selectedValue,
	setQueryListener: _types2.default.funcRequired,
	themePreset: _types2.default.themePreset,
	updateQuery: _types2.default.funcRequired,
	watchComponent: _types2.default.funcRequired,
	// component props
	autoLocation: _types2.default.bool,
	beforeValueChange: _types2.default.func,
	className: _types2.default.string,
	componentId: _types2.default.stringRequired,
	customQuery: _types2.default.func,
	data: _types2.default.data,
	dataField: _types2.default.stringRequired,
	defaultSelected: _types2.default.selectedValue,
	filterLabel: _types2.default.string,
	icon: _types2.default.children,
	iconPosition: _types2.default.iconPosition,
	innerClass: _types2.default.style,
	innerRef: _types2.default.func,
	onBlur: _types2.default.func,
	onFocus: _types2.default.func,
	onKeyDown: _types2.default.func,
	onKeyPress: _types2.default.func,
	onKeyUp: _types2.default.func,
	onQueryChange: _types2.default.func,
	onValueChange: _types2.default.func,
	placeholder: _types2.default.string,
	react: _types2.default.react,
	showFilter: _types2.default.bool,
	showIcon: _types2.default.bool,
	style: _types2.default.style,
	theme: _types2.default.style,
	title: _types2.default.title,
	unit: _types2.default.string,
	URLParams: _types2.default.bool
};

GeoDistanceDropdown.defaultProps = {
	className: null,
	placeholder: 'Select a value',
	showFilter: true,
	style: {},
	URLParams: false,
	autoLocation: true,
	unit: 'mi'
};

var mapStateToProps = function mapStateToProps(state, props) {
	return {
		mapKey: state.config.mapKey,
		selectedValue: state.selectedValues[props.componentId] && state.selectedValues[props.componentId].value || null,
		themePreset: state.config.themePreset
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
		updateQuery: function updateQuery(updateQueryObject) {
			return dispatch((0, _actions.updateQuery)(updateQueryObject));
		},
		watchComponent: function watchComponent(component, react) {
			return dispatch((0, _actions.watchComponent)(component, react));
		},
		setQueryListener: function setQueryListener(component, onQueryChange, beforeQueryChange) {
			return dispatch((0, _actions.setQueryListener)(component, onQueryChange, beforeQueryChange));
		}
	};
};

exports.default = (0, _utils.connect)(mapStateToProps, mapDispatchtoProps)((0, _emotionTheming.withTheme)(GeoDistanceDropdown));