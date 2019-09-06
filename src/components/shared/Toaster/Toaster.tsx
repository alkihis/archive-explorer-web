import React from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';

export interface ToasterMessage { 
  msg: string, 
  severity: 'success' | 'info' | 'warning' | 'error' | 'default' 
}

function MyApp() {
  const { enqueueSnackbar } = useSnackbar();

  const handleEvent = (e: CustomEvent<ToasterMessage>) => {
    enqueueSnackbar(e.detail.msg, { variant: e.detail.severity });
  };

  // @ts-ignore
  window.addEventListener('toaster.message', handleEvent);

  return (
    <React.Fragment />
  );
}

export default function IntegrationNotistack() {
  return (
    <SnackbarProvider maxSnack={3} autoHideDuration={4000}>
      <MyApp />
    </SnackbarProvider>
  );
}

export function toast(msg: string, severity?: 'success' | 'info' | 'warning' | 'error' | 'default') {
  window.dispatchEvent(new CustomEvent('toaster.message', { detail: {
    msg,
    severity: severity ? severity : "default"
  }}));
}
