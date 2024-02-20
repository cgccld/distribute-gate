import React, { useState } from 'react';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { ConnectButton } from '@rainbow-me/rainbowkit';


const items: MenuProps['items'] = [
  {
    label: (
      <ConnectButton/>
    ),
    key: 'connect-btn',
    style: {"padding": "10px 0", "marginLeft": "auto"}
  },
];

const NavBar: React.FC = () => {
  return <Menu mode="horizontal" items={items} />;
};

export default NavBar;