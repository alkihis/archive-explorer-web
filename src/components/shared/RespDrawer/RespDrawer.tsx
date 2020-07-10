import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles, Theme, createStyles } from '@material-ui/core/styles';

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
      [theme.breakpoints.up('sm')]: {
        flexDirection: 'column',
      },
    },
    drawer: {
      [theme.breakpoints.up('sm')]: {
        width: drawerWidth,
        flexShrink: 0,
      },
    },
    appBar: {
      marginLeft: drawerWidth,
    },
    menuButton: {
      marginRight: theme.spacing(2),
      [theme.breakpoints.up('sm')]: {
        display: 'none',
      },
    },
    // @ts-ignore
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
      width: drawerWidth,
      
    },
    drawerPaperFull: {
      zIndex: 4,
      [theme.breakpoints.up('sm')]: {
        marginTop: '64px',
        height: 'calc(100vh - 64px - 56px)',
        width: drawerWidth,
        position: 'fixed',
      },
    },
    drawerPaperFullAppBar: {
      zIndex: 4,
      [theme.breakpoints.up('sm')]: {
        height: 'calc(100vh - 56px)',
        width: drawerWidth,
        position: 'fixed',
      },
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      marginTop: 56,
      marginBottom: 56,
      [theme.breakpoints.up('sm')]: {
        marginTop: 64,
      },
    },
    noTop: {
      marginTop: '0 !important',
    },
    no_pad: {
      padding: 0,
    },
    full_h: {
      height: '100%'
    }
  }),
);

interface ResponsiveDrawerProps {
  drawer?: JSX.Element;
  content?: JSX.Element;
  title?: string;
  appBar?: React.ReactNode;
  mobileOpen?: boolean;
  noPadding?: boolean;
  toolbarGradient?: boolean;
  handleDrawerToggle: () => void;
}

export default function ResponsiveDrawer(props: ResponsiveDrawerProps) {
  const { drawer, title, content, appBar, handleDrawerToggle, mobileOpen, noPadding } = props;
  const classes: any = useStyles();

  const main_app_bar = (
    <AppBar position="fixed" className={classes.appBar}>
      <Toolbar className={props.toolbarGradient ? "background-flat-image-linear" : ""}>
        <IconButton
          color="inherit"
          aria-label="open drawer"
          edge="start"
          onClick={handleDrawerToggle}
          className={classes.menuButton}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" noWrap>
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );

  return (
    <div className={classes.root}>
      {appBar && <Hidden smUp>
        {main_app_bar}
      </Hidden>}
      {!appBar && main_app_bar}

      <div style={{ display: 'flex' }}>
        <nav className={classes.drawer}>
          <Hidden smUp implementation="css">
            <Drawer
              variant="temporary"
              anchor="left"
              open={mobileOpen}
              onClose={handleDrawerToggle}
              classes={{
                paper: classes.drawerPaper,
              }}
              ModalProps={{
                keepMounted: true, // Better open performance on mobile.
              }}
            >
              {drawer}
            </Drawer>
          </Hidden>  
          { /* 
          // @ts-ignore */ }
          <Hidden xsDown implementation="css" className={classes.full_h}>
            <Drawer className={classes.drawer}
              classes={{
                paper: appBar ? classes.drawerPaperFullAppBar : classes.drawerPaperFull,
              }}
              variant="permanent"
              anchor="left"
            >
              {drawer}
            </Drawer>
          </Hidden>
        </nav>
        <main className={classes.content + (noPadding ? " " + classes.no_pad : "") + (appBar ? " " + classes.noTop : "")}>
          {appBar}
          {content}
        </main>
      </div>
    </div>
  );
}