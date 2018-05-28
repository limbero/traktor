import React, { Component } from 'react';
import CountUp from 'react-countup';

const zero = -1/2 * Math.PI;
const wholeLap = 2 * Math.PI;

class ProgressCircle extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }
  
  componentDidMount() {
    const canvas = this.canvas.current;
    const ctx = canvas.getContext("2d");

    ctx.beginPath();
    ctx.arc(50, 50, 30, zero, zero + wholeLap * this.props.percent);
    ctx.stroke();
  }

  componentDidUpdate() {
    const pct = this.props.percent / 100;
    const canvas = this.canvas.current;
    const ctx = canvas.getContext("2d");


    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.arc(50, 50, 30, zero, zero + wholeLap * pct);
    ctx.stroke();
  }

  render() {
    return (
      <div className="progress-circle">
        <div className="canvas">
          <canvas ref={this.canvas} width={100} height={100} />
        </div>
        <p className="percentage">
          <CountUp
              start={this.props.prevPct}
              end={this.props.percent}
              duration={0.15}
              useEasing={true}
              separator=" "
              decimals={1}
              decimal="."
              suffix="%"
            />
          </p>
      </div>
    );
  }
}

export default ProgressCircle;
