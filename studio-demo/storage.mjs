/** Storage boundary. Local IDs work only in this browser/origin; they are not external sharing. */
import { validateSnapshot } from './model.mjs';
import { viewerPageUrl } from './urls.mjs';
export const STORAGE_KEY = 'nomadcatapult-studio-demo-v1';
export function createLocalProjectStore(storage) {
  return {
    readAll() {
      const data = JSON.parse(storage.getItem(STORAGE_KEY) || 'null');
      if (!data) return { currentId: null, projects: [] };
      if (!Array.isArray(data.projects) || data.projects.length > 20) throw new Error('Некорректный список локальных проектов.');
      return { currentId: data.currentId, projects: data.projects.map(project => ({ id: String(project.id).slice(0, 100), snapshot: validateSnapshot(project.snapshot) })) };
    },
    writeAll(data) {
      if (!Array.isArray(data.projects) || data.projects.length > 20) throw new Error('Допустимо до 20 локальных проектов.');
      storage.setItem(STORAGE_KEY, JSON.stringify({ currentId: data.currentId, projects: data.projects.map(project => ({ id: project.id, snapshot: validateSnapshot(project.snapshot) })) }));
    },
    async load(id) {
      const project = this.readAll().projects.find(project => project.id === id);
      if (!project) throw new Error('Проект не найден в этом браузере. Локальный ID не открывает данные на другом устройстве. Внешнее хранилище ещё не подключено.');
      return project.snapshot;
    }
  };
}
export function localViewerUrl(id, baseUrl) {
  const url = viewerPageUrl(baseUrl); url.search = ''; url.hash = ''; url.searchParams.set('project', id); return url.href;
}
