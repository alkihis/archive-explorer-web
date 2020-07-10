import React from 'react';
import classes from './CustomTooltip.module.scss';
import { Tooltip } from '@material-ui/core';

type TProps = {
  children: any;
  placement?: "bottom" | "bottom-end" | "bottom-start" | "left-end" | "left-start" | "left" | "right-end" | "right-start" | "right" | "top-end" | "top-start" | "top";
  title: string;
};

const CustomTooltip: React.FC<TProps> = (props: TProps) => {
  return (
    <Tooltip
      classes={{
        tooltip: classes.big_text,
        popper: classes.big_text
      }} 
      title={props.title}
      placement={props.placement ? props.placement : "bottom"}
    >
      {props.children}
    </Tooltip>
  );
}

export default CustomTooltip;
