import Head from 'next/head';
import NavBar from '../components/NavBar';
import styles from '../styles/Home.module.css';
import PreviewTable from '../components/PreviewTable';
import {
  useReadContracts,
  useWaitForTransactionReceipt,
  useWriteContract
} from 'wagmi'; // Import the hook directly

import * as XLSX from 'xlsx';
import { Address } from 'viem';
import type { NextPage } from 'next';
import { useEffect, useState } from 'react';
import { DISTRIBUTE_GATE } from '../constants';
import { erc20Abi, distributeGateAbi } from '../abi';
import { Item } from '../components/PreviewTable/types';
import {
  Input,
  Col,
  Row,
  Form,
  Button,
  Upload,
  message,
  UploadProps,
  Tag,
  Badge,
  Modal
} from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { ExclamationCircleOutlined, UploadOutlined } from '@ant-design/icons';

const layout = {
  labelCol: { span: 8 },
  wrapperCol: { span: 16 }
};

const Home: NextPage = () => {
  const [inputForm] = useForm();
  const [items, setItems] = useState<Item[]>([]);
  const [approveTx, setApproveTx] = useState('');
  const [tokenAddress, setTokenAddress] = useState('');
  const [distributeTx, setDistributeTx] = useState('');
  const [validFile, setValidFile] = useState(true);
  const [validAddress, setValidAddress] = useState(true);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleOk = () => {
    setIsModalOpen(false);
  };


  let {
    data: approveHash,
    error: approveError,
    writeContract: writeContractApprove
  } = useWriteContract();
  let {
    data: distributeHash,
    error: distributeError,
    writeContract: writeContractDistribute
  } = useWriteContract();
  let { data: approveReceipt } = useWaitForTransactionReceipt({
    hash: approveHash
  });
  let { data: distributeReceipt } = useWaitForTransactionReceipt({
    hash: distributeHash
  });

  const props: UploadProps = {
    name: 'file',
    action: 'https://run.mocky.io/v3/435e224c-44fb-4773-9faf-380c5e6a2188',
    headers: { authorization: 'authorization-text' },
    onChange({ file }) {
      if (file.status !== 'uploading') {
        if (file.status === 'removed') {
          setItems([]);
        } else {
          const reader = new FileReader();
          reader.onload = (e) => {
            const fileContent = e.target?.result;
            if (fileContent) {
              try {
                const workbook = XLSX.read(fileContent, { type: 'binary' });
                const sheetName = workbook.SheetNames[0]; // Assuming we're reading the first sheet
                const data = XLSX.utils.sheet_to_json(
                  workbook.Sheets[sheetName]
                );

                const formatted: Item[] = (data as Item[]).map(
                  (obj, index) => ({
                    key: `item_${index}`,
                    address: obj.address,
                    amount: obj.amount.toString()
                  })
                );

                setItems(formatted);
                message.success(`${file.name} file uploaded successfully`);
              } catch (error) {
                message.error('Failed to read Excel file');
              }
            }
          };
          reader.readAsBinaryString(file.originFileObj as Blob);
        }
      }
    }
  };

  const tokenContract = {
    address: tokenAddress as Address,
    abi: erc20Abi
  } as const;
  const { data: dataRead } = useReadContracts({
    contracts: [
      { ...tokenContract, functionName: 'symbol' },
      { ...tokenContract, functionName: 'decimals' }
    ]
  });
  const [name, decimals] = dataRead || [];

  const combine = () => async () => {
    try {
      setLoading(true);
      if (!tokenAddress || !items.length)
        throw new Error('Token address and data must be provided.');

      if (decimals?.result === undefined) {
        throw new Error('Decimals result is undefined');
      }

      const totalAmount = items
        .reduce(
          (acc, item) =>
            acc + BigInt(item.amount) * BigInt(10 ** decimals.result),
          BigInt(0)
        )
        .toString();
      await writeContractApprove({
        address: tokenAddress as Address,
        abi: erc20Abi,
        functionName: 'approve',
        args: [DISTRIBUTE_GATE, BigInt(totalAmount)]
      });
    } catch (error) {
      setLoading(false);
      console.error('Error combining actions:', error);
    }
  };

  useEffect(() => {
    if (approveError != null || distributeError != null) setLoading(false);
  }, [approveError, distributeError]);

  useEffect(() => {
    const isValidAddress = /^0x[a-fA-F0-9]{40}$/.test(tokenAddress);
    setValidAddress(isValidAddress);
  }, [tokenAddress]);

  useEffect(() => {
    setValidFile(items.length !== 0);
  }, [items]);

  useEffect(() => {
    async function DistributeToken(addresses: Address[], amounts: bigint[]) {
      if (decimals?.result === undefined) {
        throw new Error('Decimals result is undefined');
      }

      const weiAmounts = amounts.map(
        (amount) => BigInt(amount) * BigInt(10 ** decimals.result)
      );

      await writeContractDistribute({
        address: DISTRIBUTE_GATE as Address,
        abi: distributeGateAbi,
        functionName: 'distribute',
        args: [
          tokenAddress as Address,
          addresses as Address[],
          weiAmounts as bigint[]
        ]
      });
    }

    if (approveReceipt !== undefined) {
      const addresses = items.map((item) => item.address);
      const amounts = items.map((item) => BigInt(item.amount));
      DistributeToken(addresses as Address[], amounts);
    }
  }, [approveReceipt]);

  useEffect(() => {
    if (approveReceipt !== undefined) {
      setApproveTx(approveReceipt.transactionHash);
    } else {
      setApproveTx('');
    }
  }, [approveReceipt]);

  useEffect(() => {
    if (distributeReceipt !== undefined) {
      setLoading(false);
      setDistributeTx(distributeReceipt.transactionHash);
      setIsModalOpen(true);
    } else {
      setDistributeTx('');
    }
  }, [distributeReceipt]);

  return (
    <div className={styles.container}>
      <Head>
        <title>Distribute Gate</title>
        <meta content="distribute token more easily" name="description" />
        <link href="/favicon.ico" rel="icon" />
      </Head>
      <NavBar />

      <main className={styles.main}>
        <>
          <Row gutter={{ xs: 8, sm: 16, md: 24, lg: 32 }}>
            <Col className="gutter-row" span={12}>
              <Form {...layout} form={inputForm}>
                <Form.Item
                  name={['token', 'address']}
                  label="Token address"
                  rules={[{ required: true }]}
                  validateStatus={validAddress ? '' : 'error'}
                  help={validAddress ? '' : 'Token address is not valid.'}
                >
                  <Badge.Ribbon
                    text={name?.result}
                    style={{
                      top: -10,
                      visibility:
                        name?.result !== undefined &&
                        tokenAddress.length !== 0 &&
                        /^0x[a-fA-F0-9]{40}$/.test(tokenAddress) &&
                        decimals?.result !== undefined
                          ? 'visible'
                          : 'hidden'
                    }}
                  >
                    <Input
                      onChange={(e) => setTokenAddress(e.target.value)}
                      disabled={loading}
                    />
                  </Badge.Ribbon>
                </Form.Item>
                <Form.Item
                  name={['data', 'data']}
                  label="Sheet file"
                  rules={[{ required: true }]}
                  validateStatus={validFile ? undefined : 'error'}
                  help={validFile ? '' : 'File is not valid.'}
                >
                  <Upload {...props} accept=".xls,.xlsx" maxCount={1} disabled={loading}>
                    <Button icon={<UploadOutlined />} disabled={loading}>Click to Upload</Button>
                    <Tag
                      icon={<ExclamationCircleOutlined />}
                      color="warning"
                      style={{ marginLeft: '10px' }}
                    >
                      Warning: The code automatically converts values to wei
                    </Tag>
                  </Upload>
                </Form.Item>
                <Form.Item wrapperCol={{ ...layout.wrapperCol, offset: 8 }}>
                  <Button
                    type="primary"
                    htmlType="submit"
                    onClick={combine()}
                    loading={loading}
                    disabled={!(validAddress && validFile)}
                  >
                    {loading ? 'Transferring...' : 'Transfer'}
                  </Button>
                </Form.Item>
              </Form>
            </Col>
            <Col className="gutter-row" span={9}>
              <PreviewTable datas={items} />
            </Col>
          </Row>
          <Modal
            title="Transfer successfully"
            centered
            open={isModalOpen}
            onOk={() => setIsModalOpen(false)}
            closeIcon= {false}
            footer={[
              <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
                Ok
              </Button>,
            ]}
          >
            <a href={`https://testnet.bscscan.com/tx/${approveTx}`} target="_blank" rel="noopener noreferrer"><p>Approve tx: {`https://testnet.bscscan.com/tx/${approveTx}`}</p></a>
            <a href={`https://testnet.bscscan.com/tx/${distributeTx}`} target="_blank" rel="noopener noreferrer"><p>Distribute tx: {`https://testnet.bscscan.com/tx/${distributeTx}`}</p></a>
          </Modal>
        </>
      </main>

      <footer className={styles.footer}>
        2023 © Bountykinds. All rights reserved.
      </footer>
    </div>
  );
};

export default Home;
