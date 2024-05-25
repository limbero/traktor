import React, { Component } from 'react';
import CountUp from 'react-countup';

const zero: number = (-1 / 2) * Math.PI;
const wholeLap: number = 2 * Math.PI;

const backingScale: number = 'devicePixelRatio' in window ? window.devicePixelRatio : 1;

let canvas: HTMLCanvasElement | null;
let ctx: CanvasRenderingContext2D | null;
let scaleFactor;

type ProgressCircleProps = {
  prevPercent: number;
  percent: number;
};

class ProgressCircle extends Component<ProgressCircleProps, any> {
  canvas: React.RefObject<HTMLCanvasElement>;
  static backingScale() {
    if ('devicePixelRatio' in window) {
      return window.devicePixelRatio;
    }
    return 1;
  }

  constructor(props: ProgressCircleProps) {
    super(props);
    this.canvas = React.createRef();
  }

  componentDidMount() {
    const { percent } = this.props;
    canvas = this.canvas.current;
    scaleFactor = Math.max(backingScale, 2);

    if (canvas === null) { return; }
    canvas.width *= scaleFactor;
    canvas.height *= scaleFactor;
    canvas.style.width = `${canvas.width / scaleFactor}px`;
    canvas.style.height = `${canvas.height / scaleFactor}px`;

    // update the context for the new canvas scale
    ctx = canvas.getContext('2d');
    ctx?.scale(scaleFactor, scaleFactor);

    const pct = percent / 100;

    const step = pct / 15;

    requestAnimationFrame(() => this.animate(0, step, pct));
  }

  componentDidUpdate() {
    const { prevPercent, percent } = this.props;
    const step = (percent - prevPercent) / 1500;

    requestAnimationFrame(() =>
      this.animate(prevPercent / 100, step, percent / 100)
    );
  }

  animate(cur: number, step: number, cap: number) {
    if (ctx === null || canvas === null) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#e10000';
    ctx.arc(50, 50, 30, zero, zero + wholeLap * (cur + step));
    ctx.stroke();

    if (cur + step < cap) {
      requestAnimationFrame(() => this.animate(cur + step, step, cap));
    }
  }

  render() {
    const { prevPercent, percent }: ProgressCircleProps = this.props;
    return (
      <div className="progress-circle">
        <div className="canvas">
          <canvas ref={this.canvas} width={100} height={100} />
        </div>
        <p className="percentage">
          <CountUp
            start={prevPercent}
            end={percent}
            duration={0.15}
            useEasing
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
