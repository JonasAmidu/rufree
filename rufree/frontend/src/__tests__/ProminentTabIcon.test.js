import React from 'react';
import renderer from 'react-test-renderer';
import ProminentTabIcon from '../components/navigation/ProminentTabIcon';

describe('ProminentTabIcon', () => {
  it('renders the call-to-action label', () => {
    const tree = renderer.create(<ProminentTabIcon label="Add Activity" />).root;

    expect(tree.findByProps({ children: 'Add Activity' })).toBeTruthy();
  });

  it('changes emphasis when focused', () => {
    const focusedTree = renderer.create(<ProminentTabIcon focused />).toJSON();
    const unfocusedTree = renderer.create(<ProminentTabIcon focused={false} />).toJSON();

    expect(focusedTree).not.toEqual(unfocusedTree);
  });
});
