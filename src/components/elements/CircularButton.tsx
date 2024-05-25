import React, { CSSProperties, MouseEventHandler } from 'react';
import styled from 'styled-components';

const StyledCircularButton = styled.button`
  color: #fff;
  background-color: ${(props) => (props.color ? props.color : '#37f')};

  border-radius: 100px;
  padding: 5px 5px 8px 5px;
  width: 41px;
  height: 41px;

  font-size: 0.85em;
  font-weight: 700;
  text-decoration: none;

  cursor: pointer;
`;

type CircularButtonProps = {
  children: React.ReactNode;
  disabled?: boolean;
  onClick: MouseEventHandler;
  style?: CSSProperties;
};

const CircularButton = ({ children, disabled, onClick, style }: CircularButtonProps) => (
  <StyledCircularButton
    type="button"
    onClick={onClick}
    disabled={disabled}
    style={style}
  >
    {children}
  </StyledCircularButton>
);

export default CircularButton;
