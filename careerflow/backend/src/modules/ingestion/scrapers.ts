import { RawJob } from "../../types";

export interface IScraper {
    name: string;
    scrape(targetUrlOrConfig: string): Promise<RawJob[]>;
}
