import type { CustomFlowbiteTheme } from "flowbite-react";


const flowbiteTheme: CustomFlowbiteTheme = {
  navbar: {
    link: {
      active: {
        on: 'bg-cyan-700 text-white dark:text-white md:bg-transparent md:text-yellow-300 md:text-bold',
        off: 'border-b border-gray-100 text-gray-950 hover:bg-gray-950 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white md:border-0 md:hover:bg-transparent md:hover:text-yellow-400 md:dark:hover:bg-transparent md:dark:hover:text-white',
      }
    }
  },
  button: {
    color: {
      info: 'text-yellow-200 bg-gray-950 border border-transparent hover:bg-yellow-300 hover:text-gray-950 focus:ring-4 focus:ring-yellow-300 disabled:hover:bg-cyan-700 dark:bg-cyan-600 dark:hover:bg-cyan-700 dark:focus:ring-cyan-800 dark:disabled:hover:bg-cyan-600',
    }
  }
}

export default flowbiteTheme;
