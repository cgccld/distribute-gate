import React, { useState } from 'react';
import type { MenuProps } from 'antd';
import { Menu } from 'antd';
import { ConnectButton } from '@rainbow-me/rainbowkit';

// const items: MenuProps['items'] = [
//   {
//     label: 'DistributeGATE',
//     key: 'logo',
//     style: {
//       margin: 'auto',
//       width: '50%',
//       padding: '5px',
//       fontWeight: 'bold',
//       borderBottom: 'none'
//     }
//   },
//   {
//     label: ,
//     key: 'connect-btn',
//     style: { padding: '10px 0', marginLeft: 'auto' }
//   }
// ];

const NavBar: React.FC = () => {
  // return <Menu mode="horizontal" items={items} />;
  return (
    <Menu theme="light" mode="horizontal">
      <Menu.Item
        style={{
          margin: 'auto',
          padding: '5px',
          fontWeight: 'bold',
          marginLeft: '200px',
          marginRight: 'auto'
        }}
      >
        DistributeGATE
      </Menu.Item>
      <Menu.Item
        disabled={true}
        style={{ padding: '10px 0', marginRight: '200px', marginLeft: 'auto' }}
      >
        <ConnectButton />
      </Menu.Item>
    </Menu>
  );
};

export default NavBar;
