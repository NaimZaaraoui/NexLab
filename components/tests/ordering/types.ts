export interface Category {
  id: string;
  name: string;
  rank: number;
  icon?: string | null;
  parentId?: string | null;
  tests: Test[];
  children?: Category[];
  parent?: Category;
}

export interface Test {
  id: string;
  name: string;
  code: string;
  rank: number;
}

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  action: () => void;
}
