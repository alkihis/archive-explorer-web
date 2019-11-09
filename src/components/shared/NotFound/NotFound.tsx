import React from 'react';
import './NotFound.scss';
import { RouteComponentProps } from 'react-router';
import { setPageTitle } from '../../../helpers';
import { CenterComponent, internalError } from '../../../tools/PlacingComponents';
import LANG from '../../../classes/Lang/Language';

const NotFound = (props: RouteComponentProps) => {
  setPageTitle(LANG.page_not_found);

  return (
    <CenterComponent style={{height: '100vh', textAlign: 'center'}}>
      {internalError(LANG.page_not_found, `${LANG.you_tried_to_show} ${props.location.pathname}, ${LANG.but_it_does_not_exists}.`)}
    </CenterComponent>
  );
}

export default NotFound;
