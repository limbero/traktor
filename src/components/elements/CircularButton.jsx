import React from 'react';
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

const CircularButton = ({ children, ...rest }) => (
  <StyledCircularButton type="button" {...rest}>
    {children}
  </StyledCircularButton>
);

export default CircularButton;
