import './lib/main.css'
import './style.css'

import PhotoSwipe from './lib/photoswipe.js'
import PhotoSwipeUIDefault from './lib/photoswipe-ui-default.js'
import React from 'react'

const noop = function () {}

export default class PinchZoom extends React.Component {
  static propTypes = {
    items: React.PropTypes.arrayOf(React.PropTypes.shape({
      src: React.PropTypes.string,
      w: React.PropTypes.number,
      h: React.PropTypes.number,
    })).isRequired,
    selectedIndex: React.PropTypes.number.isRequired,
    onSelectedIndexChange: React.PropTypes.func,
    onZoomStart: React.PropTypes.func,
    onZoomEnd: React.PropTypes.func,
    onZoomIn: React.PropTypes.func,
    onZoomOut: React.PropTypes.func,
    onZoomReset: React.PropTypes.func,
    onClose: React.PropTypes.func.isRequired,
    loadingIndicator: React.PropTypes.node,
  }

  static defaultProps = {
    onSelectedIndexChange: noop,
    onZoomStart: noop,
    onZoomEnd: noop,
    onZoomIn: noop,
    onZoomOut: noop,
    onZoomReset: noop,
  }

  constructor (props) {
    super(props)

    this.state = {}
  }

  componentDidMount () {
    this.zvuiPinch = new PhotoSwipe(
      this.element,
      PhotoSwipeUIDefault,
      this.props.items,
      {
        // See http://photoswipe.com/documentation/options.html
        index: this.props.selectedIndex >= 0 ? this.props.selectedIndex : 0,
        pinchToClose: false,
        tapToClose: false,
        loop: false,
      }
    )

    this.zvuiPinch.listen('beforeChange', () => {
      this.props.onSelectedIndexChange(this.zvuiPinch.getCurrentIndex())
    })

    this.zvuiPinch.listen('afterChange', () => {
      this.initialZoomRatio = this.zvuiPinch.getZoomLevel()
    })

    this.zvuiPinch.listen('zoomGestureStarted', () => {
      this.onZoomStart()
    })

    this.zvuiPinch.listen('zoomGestureEnded', () => {
      this.onZoomEnd()
    })

    this.zvuiPinch.listen('doubleTap', () => {
      this.onZoomStart()

      // Wait until the zooming animation end then trigger `onZoomEnd` event
      // Note that the double-tap delay is 300 ms, so we need to wait 400 ms
      // See https://github.com/sylvesteraswin/react-pinch-zoom/blob/master/lib/photoswipe.js#L3287
      setTimeout(() => {
        if (!this._unmounting) {
          this.onZoomEnd()
        }
      }, 400)
    })

    this.zvuiPinch.listen('destroy', () => {
      if (!this._unmounting) {
        this.props.onClose()
      }
    })

    this.zvuiPinch.init()

    this.initialZoomRatio = this.zvuiPinch.getZoomLevel()
  }

  shouldComponentUpdate () {
    // Do not re-render the component in any circumstances
    return false
  }

  componentWillUnmount () {
    this._unmounting = true

    if (this.zvuiPinch) {
      this.zvuiPinch.close()
    }
  }

  onZoomStart = () => {
    this.formerZoomRatio = this.zvuiPinch.getZoomLevel()

    this.props.onZoomStart(this.formerZoomRatio)
  }

  onZoomEnd = () => {
    const currentZoomRatio = this.zvuiPinch.getZoomLevel()

    if (this.formerZoomRatio < currentZoomRatio) {
      this.props.onZoomIn(currentZoomRatio)
    } else {
      this.props.onZoomOut(currentZoomRatio)
    }

    this.props.onZoomEnd(currentZoomRatio)

    if (this.initialZoomRatio >= currentZoomRatio || Math.abs(this.initialZoomRatio - currentZoomRatio) < 0.01) {
      this.props.onZoomReset(currentZoomRatio)
    }
  }

  render () {
    // Do not modify this line
    const BASE_CLASS = 'zvui-pinch'

    return (
      <div className={`${BASE_CLASS}`} tabIndex='-1' role='dialog' ref={(e) => { this.element = e }}>
        <div className={`${BASE_CLASS}__bg`} />
        <div className={`${BASE_CLASS}__scroll-wrap`}>
          <div className={`${BASE_CLASS}__container`}>
            <div className={`${BASE_CLASS}__item`} />
            <div className={`${BASE_CLASS}__item`} />
            <div className={`${BASE_CLASS}__item`} />
          </div>
          <div className={`${BASE_CLASS}__ui ${BASE_CLASS}__ui--hidden`}>
            <div className={`${BASE_CLASS}__top-bar`}>
              <div className={`${BASE_CLASS}__counter`} />
              <button className={`${BASE_CLASS}__button ${BASE_CLASS}__button--close`} />
              <div className={`${BASE_CLASS}__preloader`}>
                {this.props.loadingIndicator}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }
}
