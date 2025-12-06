import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  return {
    title: 'File Converter',
    description: 'Convert files locally in your browser with complete privacy'
  };
};