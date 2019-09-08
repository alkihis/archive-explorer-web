import React from 'react';

type SProps = {
  onVisible: () => void;
  triggerMore: boolean;
};

type SState = {
  canLoadMore: boolean;
  inLoad: boolean;
}

export default class Sentinel extends React.Component<SProps, SState> {
  state: SState = {
    canLoadMore: true,
    inLoad: false
  };

  ref = React.createRef<HTMLDivElement>();

  componentDidMount() {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.intersectionRatio === 1) {
          if (this.state.canLoadMore) {
            this.setState({
              canLoadMore: false,
              inLoad: true
            });

            this.props.onVisible();
          }
        }
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 1
      }
    );

    if (this.ref.current) {
      observer.observe(this.ref.current);
    }
  }

  componentDidUpdate(old_props: SProps) {
    if (old_props !== this.props) {
      // props changed
      console.log("Updated");

      this.setState({
        canLoadMore: this.props.triggerMore,
        inLoad: false
      });
    }
    else {
      console.log("State update")
    }
  }

  render() {
    return <div ref={this.ref} style={{height: '1px', width: '100%'}} />;
  }
}
