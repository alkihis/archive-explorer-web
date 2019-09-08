import React from 'react';
import classes from './DMConversation.module.scss';
import { Conversation, LinkedDirectMessage } from 'twitter-archive-reader';

type DMProps = {
  conversation: Conversation;
};

type DMState = {
  selected: LinkedDirectMessage[] | null;
};

export default class DMConversation extends React.Component<DMProps, DMState> {
  
}
