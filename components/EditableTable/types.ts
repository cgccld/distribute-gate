export interface Item {
  key: string;
  address: string;
  amount: string;
}

export interface EditableCellProps extends React.HTMLAttributes<HTMLElement> {
  editing: boolean;
  dataIndex: string;
  title: any;
  inputType: 'number' | 'text';
  record: Item;
  index: number;
  children: React.ReactNode;
}

export type EditableTableProps = {
  originalData: Item[];
  callBackData: (d: any) => void;
};
