import React from 'react';
import classes from './DMContainer.module.scss';
import { LinkedDirectMessage } from 'twitter-archive-reader';

const LOADED_PER_CHUNK = 25;

type DMProps = {
  messages: LinkedDirectMessage[];
};

type DMState = {
  
};

export default class DMContainer extends React.Component<DMProps, DMState> {
  render() {
    return <div>This is a render function</div>
  }
}
