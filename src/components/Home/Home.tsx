import React from 'react';
import './Home.scss';
import { setPageTitle } from '../../helpers';
import { CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';

class Home extends React.Component {
  state = {
    heights: Array(1000).fill(null).map((_, index) => {
      let s = ""
      for (let i = 0; i < index; i++) {
        s += Math.random().toFixed(1);
      }
      return s
    }),
  }

  cache = new CellMeasurerCache({
    fixedWidth: true,
    defaultHeight: 30
  });

  componentDidMount() {
    setPageTitle("Home");
  }

  // @ts-ignore
  rowRenderer = ({ index, parent, key, style }) => {
    return (
      <CellMeasurer
        key={key}
        cache={this.cache}
        parent={parent}
        columnIndex={0}
        rowIndex={index}
      >
        <div style={style}>
          <div style={{maxWidth: '200px'}}>{this.state.heights[index]}</div>
          <div>Je suis un poney</div>
          {index % 2 ? <div>Hello</div> : ""}
        </div>
      </CellMeasurer>
    );
  };


  render() {
    return (
      <div className="Home">
        <section>
          <div>
            <h2>Details</h2>
            <List
              rowCount={this.state.heights.length}
              width={800}
              height={400}
              deferredMeasurementCache={this.cache}
              rowHeight={this.cache.rowHeight}
              rowRenderer={this.rowRenderer.bind(this)}
              overscanRowCount={3}
            />
          </div>
        </section>
      </div>
    );
  }
}

export default Home;
