import {useEffect, useRef} from 'react';
import {createPortal} from 'react-dom';
import type {EducationalMicroModule} from './registry';
import MicroScene from './MicroScene';

export default function MicroExplorer({module, onClose}: {module: EducationalMicroModule; onClose: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    return () => {element.close(); previous?.focus();};
  }, []);
  return createPortal(<dialog ref={dialog} className="micro-dialog" aria-labelledby="micro-title" onCancel={event => {event.preventDefault(); onClose();}} onKeyDown={event => event.stopPropagation()}>
    <header><div><span className="anatomy-eyebrow">MICROANATOMÍA</span><h2 id="micro-title">{module.title}</h2><p>{module.latin}</p></div><button autoFocus aria-label="Cerrar microanatomía" onClick={onClose}>×</button></header>
    <div className="micro-layout">
      <div className="micro-viewport"><MicroScene module={module}/><p className="micro-instructions">Arrastra para girar · rueda o dos dedos para acercar</p></div>
      <div className="micro-information" tabIndex={0} aria-label="Información de microanatomía">
        <h3>Descripción</h3><p>{module.description}</p>
        <h3>Qué puedes estudiar</h3><p>{module.function}</p>
        <h3>Relaciones</h3><p>{module.relations}</p>
        {module.format === 'swc' && <div className="micro-legend"><span><i style={{background:'#f1dca0'}}/>Soma</span><span><i style={{background:'#8dd7ed'}}/>Axón</span><span><i style={{background:'#d8b6e8'}}/>Dendritas</span></div>}
        <h3>Alcance de la representación</h3><p>{module.limitation}</p><p>{module.frame}</p>
        <h3>Fuente y licencia</h3><p><a href={module.sourceUrl} target="_blank" rel="noreferrer">{module.source}</a> · <a href={module.licenseUrl} target="_blank" rel="noreferrer">{module.license}</a></p><p>{module.attribution}</p>
        <ul>{module.references.map(reference => <li key={reference.url}><a href={reference.url} target="_blank" rel="noreferrer">{reference.label}</a></li>)}</ul>
      </div>
    </div>
  </dialog>, document.body);
}
