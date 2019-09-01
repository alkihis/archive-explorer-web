import React from 'react';
import './NotFound.scss';
import { RouteComponentProps } from 'react-router';
import { setPageTitle } from '../../../helpers';
import { CenterComponent, internalError } from '../../../tools/PlacingComponents';

const NotFound = (props: RouteComponentProps) => {
  setPageTitle("Page Not Found");

  return (
    <CenterComponent style={{height: '100vh'}}>
      {internalError(`Page not found`, `You tried to show ${props.location.pathname}, but this page does not exists.`)}
    </CenterComponent>
  );
}

export default NotFound;
