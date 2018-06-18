import React, { Component } from 'react';
import CountUp from 'react-countup';

const zero = -1/2 * Math.PI;
const wholeLap = 2 * Math.PI;

let canvas, ctx, scaleFactor;

class ProgressCircle extends Component {
  constructor(props) {
    super(props);
    this.canvas = React.createRef();
  }
  
  componentDidMount() {
    canvas = this.canvas.current;
    scaleFactor = Math.max(this.backingScale(ctx), 2);

    canvas.width = canvas.width * scaleFactor;
    canvas.height = canvas.height * scaleFactor;
    canvas.style.width = `${canvas.width / scaleFactor}px`;
    canvas.style.height = `${canvas.height / scaleFactor}px`;
    // update the context for the new canvas scale
    ctx = canvas.getContext("2d");
    ctx.scale(scaleFactor, scaleFactor);

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

  backingScale(context) {
    if ('devicePixelRatio' in window) {
      return window.devicePixelRatio;
    }
    return 1;
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
