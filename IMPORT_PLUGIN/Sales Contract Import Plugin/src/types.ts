import { UniqueIdentifier } from "@dnd-kit/core";

interface IEntryContainer {
  id: UniqueIdentifier;
  title: string;
  totalHours?: number;
  children?: React.ReactNode;
  items?: IEntry[];
  /////////////////
  //selectedStartDate: string;
  //selectedEndDate: string;
  /////////////////
  
}

interface IEntry {
  id: UniqueIdentifier;
  // entryContainerId: UniqueIdentifier;
  title: string;
  hours: number;
  description : string;
  task_key :string;
  subTask :string;
  //////////////
  date: Date;
  app_user: string;
  ///////////////

  billability: string;
}

interface IEntryProps
{
  onDuplicate: (entry: any) => void;
}

interface IDragAndDropKitContainer {
  id: UniqueIdentifier;
  title: string;
  totalHours?: number;
  ////////////////
  description : string;
  task_key : string;
  workedHours: number;
  subTask : string;
  date: Date;
  app_user: string;
  /** Addded for billability flag ****/
  billability: string;
  ////////////////
  items: IDragAndDropKitItem[];

}

interface IDragAndDropKitItem {
  id: UniqueIdentifier;
  title: string;
  timeSpent: number;
  description : string;
  task_key : string;
  workedHours: number;
  subTask : string;
  ////////////////
  date: Date;
  app_user: string;
  /////////////////

  billability: string;
}

interface EntryOptionsProps {
  taskId: UniqueIdentifier;
  taskKey: string;
  issueTitle: string;
  setIsDropdownOpen: (value: boolean) => void;
  issueSummary: string;
  workedHours :number;
  subTask: string;
  //////////////
  date: Date;
  app_user: string;
  ///////////

  billability: string;
}

interface EntryViewProps
{

}


export type {
  IEntryContainer,
  IEntry,
  IDragAndDropKitContainer,
  IDragAndDropKitItem,
  IEntryProps,
  EntryOptionsProps,
  EntryViewProps
}
