import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { observer } from 'mobx-react';
import injectSheet from 'react-jss';
import Webview from 'react-electron-web-view';
import { Icon } from '@meetfranz/ui';
import { defineMessages, intlShape } from 'react-intl';

import { mdiChevronRight, mdiCheckAll } from '@mdi/js';
import * as environment from '../../../environment';
import Appear from '../../../components/ui/effects/Appear';
import UpgradeButton from '../../../components/ui/UpgradeButton';

const OPEN_TODOS_BUTTON_SIZE = 45;
const CLOSE_TODOS_BUTTON_SIZE = 35;

const messages = defineMessages({
  premiumInfo: {
    id: 'feature.todos.premium.info',
    defaultMessage: '!!!Franz Todos are available to premium users now!',
  },
  upgradeCTA: {
    id: 'feature.todos.premium.upgrade',
    defaultMessage: '!!!Upgrade Account',
  },
  rolloutInfo: {
    id: 'feature.todos.premium.rollout',
    defaultMessage: '!!!Everyone else will have to wait a little longer.',
  },
});

const styles = theme => ({
  root: {
    background: theme.colorBackground,
    position: 'relative',
    borderLeft: [1, 'solid', theme.todos.todosLayer.borderLeftColor],
    zIndex: 300,

    transform: ({ isVisible, width }) => `translateX(${isVisible ? 0 : width}px)`,

    '&:hover $closeTodosButton': {
      opacity: 1,
    },
    '& webview': {
      height: '100%',
    },
  },
  resizeHandler: {
    position: 'absolute',
    left: 0,
    marginLeft: -5,
    width: 10,
    zIndex: 400,
    cursor: 'col-resize',
  },
  dragIndicator: {
    position: 'absolute',
    left: 0,
    width: 5,
    zIndex: 400,
    background: theme.todos.dragIndicator.background,

  },
  openTodosButton: {
    width: OPEN_TODOS_BUTTON_SIZE,
    height: OPEN_TODOS_BUTTON_SIZE,
    background: theme.todos.toggleButton.background,
    position: 'absolute',
    bottom: 120,
    right: props => (props.width + (props.isVisible ? -OPEN_TODOS_BUTTON_SIZE / 2 : 0)),
    borderRadius: OPEN_TODOS_BUTTON_SIZE / 2,
    opacity: props => (props.isVisible ? 0 : 1),
    transition: 'right 0.5s',
    zIndex: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: [0, 0, 10, theme.todos.toggleButton.shadowColor],

    borderTopRightRadius: props => (props.isVisible ? null : 0),
    borderBottomRightRadius: props => (props.isVisible ? null : 0),

    '& svg': {
      fill: theme.todos.toggleButton.textColor,
      transition: 'all 0.5s',
    },
  },
  closeTodosButton: {
    width: CLOSE_TODOS_BUTTON_SIZE,
    height: CLOSE_TODOS_BUTTON_SIZE,
    background: theme.todos.toggleButton.background,
    position: 'absolute',
    bottom: 120,
    right: ({ width }) => (width + -CLOSE_TODOS_BUTTON_SIZE / 2),
    borderRadius: CLOSE_TODOS_BUTTON_SIZE / 2,
    opacity: ({ isTodosIncludedInCurrentPlan }) => (!isTodosIncludedInCurrentPlan ? 1 : 0),
    transition: 'opacity 0.5s',
    zIndex: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: [0, 0, 10, theme.todos.toggleButton.shadowColor],

    '& svg': {
      fill: theme.todos.toggleButton.textColor,
    },
  },
  premiumContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
    margin: [0, 'auto'],
    textAlign: 'center',
  },
  premiumIcon: {
    marginBottom: 40,
    background: theme.styleTypes.primary.accent,
    fill: theme.styleTypes.primary.contrast,
    padding: 10,
    borderRadius: 10,
  },
  premiumCTA: {
    marginTop: 40,
  },
});

@injectSheet(styles) @observer
class TodosWebview extends Component {
  static propTypes = {
    classes: PropTypes.object.isRequired,
    isVisible: PropTypes.bool.isRequired,
    togglePanel: PropTypes.func.isRequired,
    handleClientMessage: PropTypes.func.isRequired,
    setTodosWebview: PropTypes.func.isRequired,
    resize: PropTypes.func.isRequired,
    width: PropTypes.number.isRequired,
    minWidth: PropTypes.number.isRequired,
    isTodosIncludedInCurrentPlan: PropTypes.bool.isRequired,
  };

  state = {
    isDragging: false,
    width: 300,
  };

  static contextTypes = {
    intl: intlShape,
  };

  componentWillMount() {
    const { width } = this.props;

    this.setState({
      width,
    });
  }

  componentDidMount() {
    this.node.addEventListener('mousemove', this.resizePanel.bind(this));
    this.node.addEventListener('mouseup', this.stopResize.bind(this));
    this.node.addEventListener('mouseleave', this.stopResize.bind(this));
  }

  startResize = (event) => {
    this.setState({
      isDragging: true,
      initialPos: event.clientX,
      delta: 0,
    });
  };

  resizePanel(e) {
    const { minWidth } = this.props;

    const {
      isDragging,
      initialPos,
    } = this.state;

    if (isDragging && Math.abs(e.clientX - window.innerWidth) > minWidth) {
      const delta = e.clientX - initialPos;

      this.setState({
        delta,
      });
    }
  }

  stopResize() {
    const {
      resize,
      minWidth,
    } = this.props;

    const {
      isDragging,
      delta,
      width,
    } = this.state;

    if (isDragging) {
      let newWidth = width + (delta < 0 ? Math.abs(delta) : -Math.abs(delta));

      if (newWidth < minWidth) {
        newWidth = minWidth;
      }

      this.setState({
        isDragging: false,
        delta: 0,
        width: newWidth,
      });

      resize(newWidth);
    }
  }

  startListeningToIpcMessages() {
    const { handleClientMessage } = this.props;
    if (!this.webview) return;
    this.webview.addEventListener('ipc-message', e => handleClientMessage(e.args[0]));
  }

  render() {
    const {
      classes,
      isVisible,
      togglePanel,
      isTodosIncludedInCurrentPlan,
    } = this.props;

    const {
      width,
      delta,
      isDragging,
    } = this.state;

    const { intl } = this.context;

    return (
      <div
        className={classes.root}
        style={{ width: isVisible ? width : 0 }}
        onMouseUp={() => this.stopResize()}
        ref={(node) => { this.node = node; }}
      >
        <button
          onClick={() => togglePanel()}
          className={isVisible ? classes.closeTodosButton : classes.openTodosButton}
          type="button"
        >
          <Icon icon={isVisible ? mdiChevronRight : mdiCheckAll} size={2} />
        </button>
        <div
          className={classes.resizeHandler}
          style={Object.assign({ left: delta }, isDragging ? { width: 600, marginLeft: -200 } : {})} // This hack is required as resizing with webviews beneath behaves quite bad
          onMouseDown={e => this.startResize(e)}
        />
        {isDragging && (
          <div
            className={classes.dragIndicator}
            style={{ left: delta }} // This hack is required as resizing with webviews beneath behaves quite bad
          />
        )}
        {isTodosIncludedInCurrentPlan ? (
          <Webview
            className={classes.webview}
            onDidAttach={() => {
              const { setTodosWebview } = this.props;
              setTodosWebview(this.webview);
              this.startListeningToIpcMessages();
            }}
            partition="persist:todos"
            preload="./features/todos/preload.js"
            ref={(webview) => { this.webview = webview ? webview.view : null; }}
            src={environment.TODOS_FRONTEND}
          />
        ) : (
          <Appear>
            <div className={classes.premiumContainer}>
              <Icon icon={mdiCheckAll} className={classes.premiumIcon} size={4} />
              <p>{intl.formatMessage(messages.premiumInfo)}</p>
              <p>{intl.formatMessage(messages.rolloutInfo)}</p>
              <UpgradeButton
                className={classes.premiumCTA}
                gaEventInfo={{ category: 'Todos', event: 'upgrade' }}
                short
              />
            </div>
          </Appear>
        )}
      </div>
    );
  }
}

export default TodosWebview;
