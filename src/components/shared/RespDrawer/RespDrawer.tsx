import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import CssBaseline from '@material-ui/core/CssBaseline';
import Drawer from '@material-ui/core/Drawer';
import Hidden from '@material-ui/core/Hidden';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles, useTheme, Theme, createStyles } from '@material-ui/core/styles';

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
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
    toolbar: theme.mixins.toolbar,
    drawerPaper: {
      width: drawerWidth,
      
    },
    drawerPaperFull: {
      position: 'inherit',
      zIndex: 'inherit',
      [theme.breakpoints.up('sm')]: {
        marginTop: '64px',
        minHeight: 'calc(100vh - 64px - 56px)',
      },
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      marginTop: '56px',
      [theme.breakpoints.up('sm')]: {
        marginTop: '64px',
      },
    },
    no_pad: {
      padding: 0
    },
    full_h: {
      height: '100%'
    }
  }),
);

interface ResponsiveDrawerProps {
  /**
   * Injected by the documentation to work in an iframe.
   * You won't need it on your project.
   */
  drawer?: JSX.Element;
  content?: JSX.Element;
  title: string;
  mobileOpen?: boolean;
  noPadding?: boolean;
  handleDrawerToggle: () => void;
}

export default function ResponsiveDrawer(props: ResponsiveDrawerProps) {
  const { drawer, title, content, handleDrawerToggle, mobileOpen, noPadding } = props;
  // @ts-ignore
  const classes = useStyles();

  return (
    <div className={classes.root}>
      {/* <CssBaseline /> */}
      <AppBar position="fixed" className={classes.appBar}>
        <Toolbar>
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
          <Drawer className={classes.full_h}
            classes={{
              paper: classes.drawerPaperFull,
            }}
            variant="permanent"
            open
          >
            {drawer}
          </Drawer>
        </Hidden>
      </nav>
      <main className={classes.content + (noPadding ? " " + classes.no_pad : "")}>{content}</main>
    </div>
  );
}