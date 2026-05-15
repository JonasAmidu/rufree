import React from 'react';
import renderer, { act } from 'react-test-renderer';
import ProminentTabIcon from '../components/navigation/ProminentTabIcon';

describe('ProminentTabIcon', () => {
  it('renders the call-to-action label', () => {
    let component;

    act(() => {
      component = renderer.create(<ProminentTabIcon label="Add Activity" />);
    });

    const tree = component.root;

    expect(tree.findByProps({ children: 'Add Activity' })).toBeTruthy();
  });

  it('changes emphasis when focused', () => {
    let focusedComponent;
    let unfocusedComponent;

    act(() => {
      focusedComponent = renderer.create(<ProminentTabIcon focused />);
      unfocusedComponent = renderer.create(<ProminentTabIcon focused={false} />);
    });

    const focusedTree = focusedComponent.toJSON();
    const unfocusedTree = unfocusedComponent.toJSON();

    expect(focusedTree).not.toEqual(unfocusedTree);
  });
});
