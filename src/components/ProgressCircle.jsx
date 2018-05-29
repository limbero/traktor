import React, { Component } from 'react';
import CountUp from 'react-countup';

const zero = -1/2 * Math.PI;
const wholeLap = 2 * Math.PI;

let canvas, ctx;

class ProgressCircle extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }
  
  componentDidMount() {
    canvas = this.canvas.current;
    ctx = canvas.getContext("2d");

    const pct = this.props.percent / 100;

    const step = pct / 15;

    requestAnimationFrame(() => this.animate(0, step, pct));
  }

  componentDidUpdate() {
    const prevPct = this.props.prevPct / 100;
    const pct = this.props.percent / 100;

    const step = (pct - prevPct) / 15;

    requestAnimationFrame(() => this.animate(prevPct, step, pct));
  }

  animate(cur, step, cap) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.arc(50, 50, 30, zero, zero + wholeLap * (cur+step));
    ctx.stroke();

    if (cur + step < cap) {
      requestAnimationFrame(() => this.animate(cur+step, step, cap));
    }
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
