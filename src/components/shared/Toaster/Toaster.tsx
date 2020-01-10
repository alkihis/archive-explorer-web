import React from 'react';
import { SnackbarProvider, useSnackbar } from 'notistack';
import uuidv4 from 'uuid/v4';

export interface ToasterMessage { 
  msg: string, 
  severity: 'success' | 'info' | 'warning' | 'error' | 'default',
  id: string,
}

const UUID_HANDLED = new Set<string>();

function MyApp() {
  const { enqueueSnackbar } = useSnackbar();

  const handleEvent = (e: CustomEvent<ToasterMessage>) => {
    if (UUID_HANDLED.has(e.detail.id)) {
      return;
    }
    UUID_HANDLED.add(e.detail.id);

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
  const uuid = uuidv4();

  window.dispatchEvent(new CustomEvent('toaster.message', { detail: {
    msg,
    severity: severity ? severity : "default",
    id: uuid
  }}));
}
