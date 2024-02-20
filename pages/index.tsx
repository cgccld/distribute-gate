import styles from '../styles/Home.module.css';
import Head from 'next/head';
import NavBar from '../components/NavBar';
import EditableTable from '../components/EditableTable';
import { useWaitForTransactionReceipt, useWriteContract } from 'wagmi'; // Import the hook directly

import { Address } from 'viem';
import type { NextPage } from 'next';
import { useCallback, useEffect, useState } from 'react';
import { DISTRIBUTE_GATE } from '../constants';
import { erc20Abi, distributeGateAbi } from '../abi';
import { Item } from '../components/EditableTable/types';
import { Input, Col, Row, Form, Button } from 'antd';

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 }
};

const validateMessages = {
  required: '${label} is required!'
};

const Home: NextPage = () => {
  const [rawData, setRawData] = useState('');
  const [items, setItems] = useState<Item[]>([]);
  const [tokenAddress, setTokenAddress] = useState('');
  const [visible, setVisible] = useState('none');
  const [approveTx, setApproveTx] = useState('');
  const [distributeTx, setDistributeTx] = useState('');
  const [loading, setLoading] = useState(false);

  const parseData = (data: string) => {
    if (typeof data !== 'string') {
      console.error('Data is not a string:', data);
      return []; // Return an empty array or handle the error appropriately
    }

    const rows = data.trim().split('\n');
    return rows.map((row, index) => {
      const [address, amount] = row.trim().split('\t');
      return {
        key: (index + 1).toString(),
        address,
        amount
      };
    });
  };

  const {
    data: approveHash,
    error: approveError,
    writeContract: writeContractApprove
  } = useWriteContract();
  const {
    data: distributeHash,
    error: distributeError,
    writeContract: writeContractDistribute
  } = useWriteContract();
  const { data: approveReceipt } = useWaitForTransactionReceipt({
    hash: approveHash
  });
  const { data: distributeReceipt } = useWaitForTransactionReceipt({
    hash: distributeHash
  });

  const Approve = async (totalAmount: string) => {
    await writeContractApprove({
      address: tokenAddress as Address,
      abi: erc20Abi,
      functionName: 'approve',
      args: [DISTRIBUTE_GATE, BigInt(totalAmount)]
    });
  };

  const combine = () => {
    return async () => {
      try {
        setLoading(true);
        if (!tokenAddress || !items.length) {
          throw new Error('Token address and data must be provided.');
        }
        const totalAmount = items
          .reduce((acc, item) => acc + BigInt(item.amount), BigInt(0))
          .toString();
        if (!approveReceipt && !distributeReceipt) {
          await Approve(totalAmount);
        }
      } catch (error) {
        setLoading(false);
        console.error('Error combining actions:', error);
      }
    };
  };

  useEffect(() => {
    if (rawData) {
      const parsedData = parseData(rawData);
      setItems(parsedData);
    } else {
      setItems([]);
    }
  }, [rawData]);

  useEffect(() => {
    if (approveError != null || distributeError != null) {
      setLoading(false);
    }
  }, [approveError, distributeError]);

  useEffect(() => {
    async function DistributeToken(addresses: Address[], amounts: bigint[]) {
      await writeContractDistribute({
        address: DISTRIBUTE_GATE as Address,
        abi: distributeGateAbi,
        functionName: 'distribute',
        args: [
          tokenAddress as Address,
          addresses as Address[],
          amounts as bigint[]
        ]
      });
    }

    if (approveReceipt) {
      const addresses = items.map((item) => item.address);
      const amounts = items.map((item) => BigInt(item.amount));
      DistributeToken(addresses as Address[], amounts);
    }
  }, [approveReceipt, items, tokenAddress, writeContractDistribute]);

  useEffect(() => {
    if (approveReceipt && distributeReceipt) {
      setVisible('');
      setLoading(false);
      setApproveTx(approveReceipt.transactionHash);
      setDistributeTx(distributeReceipt.transactionHash);
    }
  }, [approveReceipt, distributeReceipt]);

  const callBackData = useCallback((newData: any) => {
    setItems(newData);
  }, [])

  return (
    <div className={styles.container}>
      <Head>
        <title>Distribute Gate</title>
        <meta content="distribute token more easily" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <NavBar />

      <main className={styles.main}>
        <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
          <Col className="gutter-row" span={12}>
            <Form
              {...layout}
              name="nest-messages"
              validateMessages={validateMessages}
            >
              <Form.Item
                name={['token', 'address']}
                label="Token address"
                rules={[{ required: true }]}
              >
                <Input onChange={(e) => setTokenAddress(e.target.value)} />
              </Form.Item>
              <Form.Item
                name={['data', 'data']}
                label="Sheets copied data"
                rules={[{ required: true }]}
              >
                <Input.TextArea
                  onChange={(e) => setRawData(e.target.value)}
                  autoSize={{ minRows: 10, maxRows: 10 }}
                />
              </Form.Item>
              <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 8 }}>
                <Button
                  type="primary"
                  htmlType="submit"
                  onClick={combine()}
                  loading={loading}
                >
                  {loading ? 'Transferring...' : 'Transfer'}
                </Button>
              </Form.Item>
              <Form.Item label="Approve tx hash" style={{ display: visible }}>
                <Input value={`https://testnet.bscscan.com/tx/${approveTx}`} />
              </Form.Item>
              <Form.Item
                label="Distribute tx hash"
                style={{ display: visible }}
              >
                <Input
                  value={`https://testnet.bscscan.com/tx/${distributeTx}`}
                />
              </Form.Item>
            </Form>
          </Col>
          <Col className="gutter-row" span={12}>
            <EditableTable originalData={items} callBackData={callBackData} />
          </Col>
        </Row>
      </main>

      <footer className={styles.footer}>Made with ❤️ by tasibii</footer>
    </div>
  );
};

export default Home;
