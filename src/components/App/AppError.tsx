import React from 'react';
import { CenterComponent } from '../../tools/PlacingComponents';
import LANG from '../../classes/Lang/Language';
import { Typography, Paper } from '@material-ui/core';

export default function AppError({ error }: { error: any }) {
  let stack: string;
  if (typeof error === 'string') {
    stack = error;
  }
  else if (error instanceof Error) {
    if ('original_stack' in error) {
      // @ts-ignore
      stack = `${error.message}\n${error.stack}\n--- From original error ---\n${error.original_stack}`;
    }
    else {
      stack = `${error.message}\n${error.stack}`;
    }
  }
  else {
    stack = JSON.stringify(error);
  }

  return (
    <CenterComponent>
      <div style={{ maxWidth: '90vw', marginTop: '15px' }}>
        <Typography variant="h4" gutterBottom>
          {LANG.fatal_error}
        </Typography>

        <Paper style={{ padding: 14 }}>
          <Typography component="pre" className="pre-wrap break-word">
            <code>
              {stack}
            </code>
          </Typography>
        </Paper>
      </div>
    </CenterComponent>
  );
}
