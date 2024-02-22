export interface Item {
  key: string;
  address: string;
  amount: string;
}

export interface CellProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

export type PreviewTableProps = {
  datas: Item[];
};
