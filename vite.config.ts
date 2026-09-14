import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import {tanstackRouter} from '@tanstack/router-plugin/vite';
const base = process.env.BASE_PATH || '/med3d/';
export default defineConfig({base, plugins:[tanstackRouter({target:'react',autoCodeSplitting:true}),react()],build:{target:'es2022'}});
