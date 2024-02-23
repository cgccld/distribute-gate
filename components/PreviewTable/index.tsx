import React, { useEffect, useState } from 'react';
import { Form, Table } from 'antd';
import { Item, CellProps, PreviewTableProps } from './types';

const Cell: React.FC<CellProps> = ({ children, ...restProps }) => {
  return <td {...restProps}>{children}</td>;
};

const PreviewTable: React.FC<PreviewTableProps> = ({ datas }) => {
  const [form] = Form.useForm();
  const [data, setData] = useState<Item[]>(datas);

  useEffect(() => {
    setData(datas);
  }, [datas]);

  const columns = [
    {
      title: 'Recipient Address',
      dataIndex: 'address',
      width: '65%'
    },
    {
      title: 'Transfer Amount',
      dataIndex: 'amount',
      width: '35%'
    }
  ];

  const mergedColumns = columns.map((col) => {
    return col;
  });

  return (
    <Form form={form} component={false}>
      <Table
        components={{
          body: {
            cell: Cell
          }
        }}
        bordered
        dataSource={data}
        columns={mergedColumns}
        rowClassName="editable-row"
      />
    </Form>
  );
};

export default PreviewTable;
