import classes from './EmptyMessage.module.scss';
import React from 'react';
import { CenterComponent } from '../../../tools/PlacingComponents';
import { Typography } from '@material-ui/core';

type EmptyMessageProps = {
  icon: any;
  main: string;
  second: JSX.Element | string;
};

export default function EmptyMessage(props: EmptyMessageProps) {
  const Icon = props.icon;
  
  return (
    <div className="center-absolute">
      <CenterComponent className={classes.text_lighten} style={{minWidth: '70vw'}}>
        <Icon className={classes.icon + " icon-error-color"} />
        <Typography 
          variant="h3" 
          className="background-text-error-linear tweet-font" 
          style={{
            marginTop: "1rem", 
            marginBottom: ".7rem", 
            textAlign: 'center',
            fontWeight: 600,
            letterSpacing: '-0.05rem'
          }}
        >
          {props.main}
        </Typography>
        <Typography variant="h6" style={{textAlign: 'center'}}>
          {props.second}
        </Typography>
      </CenterComponent>
    </div>
  )
}
