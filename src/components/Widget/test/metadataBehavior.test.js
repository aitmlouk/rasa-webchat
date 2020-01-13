import React from 'react';
import { shallow } from 'enzyme';
import { Provider } from 'react-redux';

import assetMock from 'tests-mocks/fileMock';
import Widget from '../index';
import { initStore } from '../../../store/store';
import LocalStorageMock from '../../../../mocks/localStorageMock';

const localStorage = new LocalStorageMock();
let sentToSocket = [];
const mockSocket = {
  emit: jest.fn((action, message) => sentToSocket.push({ action, message }))
};
const store = initStore('dummy', 'dummy', mockSocket, localStorage);

describe('Metadata store affect app behavior', () => {
  const profile = assetMock;
  const handleUserMessage = jest.fn();

  store.dispatch({
    type: 'CONNECT' });
  const widgetComponent = shallow(
    <Provider store={store}>
      <Widget
        store={store}
        handleNewUserMessage={handleUserMessage}
        profileAvatar={profile}
        dispatch={store.dispatch}
        connectOn="open"
        customMessageDelay={() => {}}
        connected
        isChatOpen={false}
      />
    </Provider>
    , { disableLifecycleMethods: true }
  );

  let elemAttributes;
  const spyFunc = jest.fn(() => ({ setAttribute(attribute, value) {
    elemAttributes = { attribute, value };
  } }));
  Object.defineProperty(document, 'querySelector', { value: spyFunc });

  beforeEach(() => sentToSocket = []);

  it('should use the callbackIntent on expected url change', () => {
    store.dispatch({ type: 'SET_OLD_URL', url: 'lorem.com' });
    store.dispatch({ type: 'SET_PAGECHANGE_CALLBACKS',
      pageChangeCallbacks: {
        pageChanges: [
          {
            url: 'ipsum.com',
            callbackIntent: '/yes',
            regex: false
          }
        ],
        errorIntent: '/no'
      } });
    store.dispatch({ type: 'EVAL_URL', url: 'ipsum.com' });
    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0].message.message).toEqual('/yes');
  });


  it('should use the errorIntent on bad url change', () => {
    store.dispatch({ type: 'SET_OLD_URL', url: 'lorem.com' });
    store.dispatch({ type: 'SET_PAGECHANGE_CALLBACKS',
      pageChangeCallbacks: {
        pageChanges: [
          {
            url: 'ipsum.com',
            callbackIntent: '/yes',
            regex: false
          }
        ],
        errorIntent: '/no'
      } });
    store.dispatch({ type: 'EVAL_URL', url: 'dolor.com' });
    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0].message.message).toEqual('/no');
  });

  it('should use the regex for urlchecking', () => {
    store.dispatch({ type: 'SET_OLD_URL', url: 'lorem.com' });
    store.dispatch({ type: 'SET_PAGECHANGE_CALLBACKS',
      pageChangeCallbacks: {
        pageChanges: [
          {
            url: /dolor.+sit/,
            callbackIntent: '/yes',
            regex: true
          }
        ],
        errorIntent: '/no'
      } });
    store.dispatch({ type: 'EVAL_URL', url: 'dolor/amet/sit.com' });
    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0].message.message).toEqual('/yes');
  });

  it('should use multiple the regex/string for urlchecking', () => {
    store.dispatch({ type: 'SET_OLD_URL', url: 'lorem.com' });
    store.dispatch({ type: 'SET_PAGECHANGE_CALLBACKS',
      pageChangeCallbacks: {
        pageChanges: [
          {
            url: /dolor.+sit/,
            callbackIntent: '/dolor',
            regex: true
          },
          {
            url: 'elit.com/se',
            callbackIntent: '/se',
            regex: false
          },
          {
            url: /elit.+sed/,
            callbackIntent: '/yes',
            regex: true
          }
        ],
        errorIntent: '/no'
      } });
    store.dispatch({ type: 'EVAL_URL', url: 'elit.com/sed' });
    expect(sentToSocket).toHaveLength(1);
    expect(sentToSocket[0].message.message).toEqual('/yes');
  });

  it('should change the style of a element', () => {
    store.dispatch({ type: 'SET_DOM_HIGHLIGHT',
      domHighlight: {
        selector: '.test',
        css: 'color: red'
      } });

    widgetComponent.dive().dive().dive().dive()
      .dive()
      .instance()
      .applyCustomStyle();

    expect(elemAttributes).toEqual({ attribute: 'style', value: 'color: red' });
    expect(spyFunc).toHaveBeenCalled();
    const botUtter = {
      text: 'test'
    };
    widgetComponent.dive().dive().dive().dive()
      .dive()
      .instance()
      .handleBotUtterance(botUtter);
    expect(elemAttributes).toEqual({ attribute: 'style', value: '' });
  });

  it('should apply the default the style to an element', () => {
    store.dispatch({ type: 'SET_DOM_HIGHLIGHT',
      domHighlight: {
        selector: '.test',
        css: ''
      } });

    widgetComponent.dive().dive().instance().applyCustomStyle();

    expect(elemAttributes).toEqual({ attribute: 'style', value: 'animation: blinker 0.5s linear infinite alternate;' });
    expect(spyFunc).toHaveBeenCalled();
    const botUtter = {
      text: 'test'
    };
    widgetComponent.dive().dive().instance().handleBotUtterance(botUtter);
    expect(elemAttributes).toEqual({ attribute: 'style', value: '' });
  });
});

