import React from 'react';
import { Typography } from "@material-ui/core";
import LANG from "../../classes/Lang/Language";

const FindUseful = () => (
  <Typography variant="body2" color="textSecondary" align="center">
      {LANG.help_with_donate}{" "} 
      <a href="https://paypal.me/alkihis/5" target="_blank" rel="noopener noreferrer">{LANG.little}</a>.
    </Typography>
);

export default FindUseful;
