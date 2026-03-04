import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Image from "@tiptap/extension-image";

import style from './Editor.module.scss';
import { EditorFile } from '@Components/Modals/Task';
import CustomButton from '@Components/Button';


interface EditorProps {
    description: string;
    isFocusDescription: boolean;
    isDisabledCreateButton: boolean;
    setFiles: React.Dispatch<React.SetStateAction<EditorFile[]>>;
    setDescription: React.Dispatch<React.SetStateAction<string>>;
    onClose: () => void;
    onCreate: () => void;
}

const Editor: React.FC<EditorProps> = ({
    description,
    isFocusDescription,
    isDisabledCreateButton,
    setFiles,
    setDescription,
    onClose,
    onCreate
}) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [marks, setMarks] = useState({
        bold: false,
        italic: false,
        underline: false,
    });

    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
            Image.extend({
                addAttributes() {
                    return {
                        ...this.parent?.(),
                        'data-file-id': {
                            default: null,
                        },
                    };
                },
                parseHTML() {
                    return [
                        {
                            tag: 'img[src]',
                        },
                    ];
                },
                renderHTML({ HTMLAttributes }) {
                    return ['img', HTMLAttributes];
                },
            }),
        ],
        content: description,
        onUpdate({ editor }) {
            setMarks({
                bold: editor.isActive("bold"),
                italic: editor.isActive("italic"),
                underline: editor.isActive("underline"),
            });
            setDescription(editor.getHTML());
        },
        onFocus() {
            setMarks({
                bold: editor.isActive("bold"),
                italic: editor.isActive("italic"),
                underline: editor.isActive("underline"),
            });
            setDescription(editor.getHTML());
        }
    });

    useEffect(() => {
        if (!isFocusDescription) return;

        editor.commands.focus();
    }, [isFocusDescription])

    useEffect(() => {
        if (!editor || !description) return;

        editor.commands.setContent(description);
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        const updateFiles = () => {
            const json = editor.getJSON();
            const usedIds = new Set<string>();

            const traverse = (nodes: any[]) => {
                nodes.forEach(node => {
                    if (node.type === 'image' && node.attrs?.['data-file-id']) {
                        usedIds.add(node.attrs['data-file-id']);
                    }
                    if (node.content) traverse(node.content);
                });
            };

            traverse(json.content || []);

            setFiles(prev => prev.filter(f => usedIds.has(f.id)));
        };

        editor.on('update', updateFiles);

        return () => {
            editor.off('update', updateFiles);
        };
    }, [editor]);

    useEffect(() => {
        if (!editor) return;

        const handlePaste = (event: ClipboardEvent) => {
            const items = event.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                if (item.type.startsWith('image/')) {
                    event.preventDefault();

                    const file = item.getAsFile();
                    if (!file) return;

                    const id = crypto.randomUUID();

                    setFiles(prev => [...prev, { id, file }]);

                    editor
                        .chain()
                        .focus()
                        .setImage({
                            src: URL.createObjectURL(file),
                            'data-file-id': id,
                        } as any)
                        .run();

                    break;
                }
            }
        };

        const dom = editor.view.dom;
        dom.addEventListener('paste', handlePaste);

        return () => {
            dom.removeEventListener('paste', handlePaste);
        };
    }, [editor]);

    const handleFileSelect = (file: File) => {
        const id = crypto.randomUUID();

        setFiles(prev => [...prev, { id, file }]);

        editor
            ?.chain()
            .focus()
            .setImage({
                src: URL.createObjectURL(file),
                'data-file-id': id,
            } as any)
            .run();
    };

    if (!editor) return <></>;

    return (
        <div className={style.container}>
            {/* File Uploader */}
            <input
                type="file"
                accept="image/*"
                hidden
                ref={fileInputRef}
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    handleFileSelect(file);

                    e.currentTarget.value = '';
                }} />
            <EditorContent
                style={{
                    minHeight: 120,
                    maxHeight: 640,
                    paddingRight: 18,
                    paddingLeft: 18,
                    paddingTop: 6,
                    paddingBottom: 6
                }}
                className={style.editor}
                editor={editor} />
            <div className={style.editorToolbarContainer}>
                <div className={style.editorToolbar}>
                    {/* Bold */}
                    <svg
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`${style.toolbarBtn} ${marks.bold ? style.active : ''}`}
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="#141417">
                        <rect x="0.5" y="0.5" width="20.9232" height="20.9232" rx="7.5" fill="#141417" stroke="#ACACAC" />
                        <path d="M7.30743 5.8623H11.6922C13.298 5.8623 14.5993 7.16372 14.5994 8.76953C14.5994 9.48051 14.3435 10.1354 13.9188 10.6396L13.907 10.6533L13.9227 10.6631C14.7651 11.172 15.3308 12.0961 15.3309 13.1543C15.3309 14.7602 14.0286 16.0615 12.4227 16.0615H7.30743C6.912 16.0614 6.59259 15.7422 6.59259 15.3467C6.59262 14.9512 6.91201 14.632 7.30743 14.6318H7.68829V7.29297H7.30743C6.91199 7.2928 6.59259 6.97263 6.59259 6.57715C6.59275 6.18181 6.9121 5.86247 7.30743 5.8623ZM9.11896 14.6318H12.4227C13.2374 14.6318 13.9002 13.9691 13.9002 13.1543C13.9001 12.3396 13.2374 11.6768 12.4227 11.6768H9.11896V14.6318ZM9.11896 10.2471H11.6922C12.507 10.2471 13.1697 9.5843 13.1697 8.76953C13.1696 7.95488 12.5069 7.29297 11.6922 7.29297H9.11896V10.2471Z" fill="#989899" strokeWidth="0.03125" />
                    </svg>

                    {/* Italic */}
                    <svg
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`${style.toolbarBtn} ${marks.italic ? style.active : ''}`}
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="#141417">
                        <rect x="0.5" y="0.5" width="20.9232" height="20.9232" rx="7.5" fill="#141417" stroke="#ACACAC" />
                        <path d="M10.2313 5.8623H14.6151C15.0106 5.8623 15.3308 6.18171 15.3309 6.57715C15.3309 6.97273 15.0107 7.29297 14.6151 7.29297C13.7972 7.29314 13.0595 7.78502 12.745 8.54004L10.7782 13.2607C10.5066 13.9128 10.9859 14.6317 11.6923 14.6318C12.0878 14.6318 12.4071 14.9511 12.4071 15.3467C12.4071 15.7423 12.0878 16.0615 11.6923 16.0615H7.3075C6.91206 16.0614 6.59265 15.7422 6.59265 15.3467C6.59268 14.9512 6.91208 14.632 7.3075 14.6318C8.12552 14.6318 8.86401 14.1399 9.17859 13.3848L11.1444 8.66309C11.4159 8.0111 10.9375 7.29326 10.2313 7.29297C9.83574 7.29297 9.5155 6.97273 9.5155 6.57715C9.51567 6.18171 9.83585 5.8623 10.2313 5.8623Z" fill="#989899" stroke="#ACACAC" strokeWidth="0.03125" />
                    </svg>

                    {/* Underline */}
                    <svg
                        onClick={() => editor.chain().focus().toggleUnderline().run()}
                        className={`${style.toolbarBtn} ${marks.underline ? style.active : ''}`}
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="#141417">
                        <rect x="0.5" y="0.5" width="20.9232" height="20.9232" rx="7.5" fill="#141417" stroke="#ACACAC" />
                        <path d="M6.57672 14.6318H15.3463C15.7418 14.6318 16.0611 14.9511 16.0611 15.3467C16.0611 15.7423 15.7418 16.0615 15.3463 16.0615H6.57672C6.18128 16.0614 5.86188 15.7422 5.86188 15.3467C5.86191 14.9512 6.1813 14.632 6.57672 14.6318ZM6.94196 5.8623H9.13434C9.52982 5.8623 9.84999 6.18171 9.85016 6.57715C9.85016 6.97273 9.52992 7.29297 9.13434 7.29297C8.92409 7.29318 8.75348 7.46353 8.75348 7.67383V10.2314C8.75355 11.4503 9.74264 12.4394 10.9615 12.4395C12.1804 12.4395 13.1694 11.4504 13.1695 10.2314V7.67383C13.1695 7.46341 12.999 7.29299 12.7886 7.29297C12.3931 7.29297 12.0738 6.97273 12.0738 6.57715C12.074 6.18171 12.3932 5.8623 12.7886 5.8623H14.981C15.3765 5.86236 15.6957 6.18174 15.6959 6.57715C15.6959 6.9727 15.3766 7.29292 14.981 7.29297C14.7706 7.29297 14.6002 7.4634 14.6002 7.67383V10.2314C14.6001 12.2415 12.9716 13.8691 10.9615 13.8691C8.95148 13.869 7.32386 12.2415 7.32379 10.2314V7.67383C7.32379 7.4634 7.15238 7.29297 6.94196 7.29297C6.54659 7.29272 6.22711 6.97258 6.22711 6.57715C6.22728 6.18186 6.54669 5.86255 6.94196 5.8623Z" fill="#ACACAC" stroke="#ACACAC" strokeWidth="0.03125" />
                    </svg>

                    {/* List */}
                    <svg
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        style={{ marginLeft: 5 }}
                        className={`${style.toolbarBtn} ${editor.isActive("bulletList") ? style.active : ''}`}
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="#141417">
                        <rect x="0.5" y="0.5" width="20.9232" height="20.9232" rx="7.5" fill="#141417" stroke="#ACACAC" />
                        <path d="M6.211 13.9004C6.49756 13.9004 6.77301 14.0142 6.97565 14.2168C7.17829 14.4194 7.29205 14.6949 7.29205 14.9814C7.29195 15.2678 7.17816 15.5426 6.97565 15.7451C6.77301 15.9478 6.49757 16.0615 6.211 16.0615C5.92459 16.0614 5.64986 15.9476 5.44733 15.7451C5.2448 15.5426 5.13103 15.2679 5.13092 14.9814C5.13092 14.6949 5.24469 14.4194 5.44733 14.2168C5.64985 14.0143 5.92462 13.9005 6.211 13.9004ZM9.13483 14.2656H15.712C16.1073 14.2659 16.4268 14.586 16.4268 14.9814C16.4266 15.3767 16.1072 15.696 15.712 15.6963H9.13483C8.73938 15.6963 8.41922 15.3768 8.41901 14.9814C8.41901 14.5859 8.73925 14.2656 9.13483 14.2656ZM6.211 10.2471C6.3529 10.2471 6.49396 10.2748 6.62506 10.3291C6.75609 10.3834 6.87535 10.4632 6.97565 10.5635C7.07587 10.6638 7.15576 10.7831 7.21002 10.9141C7.2642 11.045 7.29205 11.1854 7.29205 11.3271C7.29205 11.4689 7.26419 11.6093 7.21002 11.7402C7.15577 11.8712 7.07585 11.9905 6.97565 12.0908C6.87536 12.1911 6.75609 12.2709 6.62506 12.3252C6.49396 12.3795 6.3529 12.4072 6.211 12.4072C6.06926 12.4072 5.92887 12.3794 5.79791 12.3252C5.66687 12.2709 5.54763 12.1911 5.44733 12.0908C5.3471 11.9905 5.26721 11.8712 5.21295 11.7402C5.15877 11.6093 5.13092 11.4689 5.13092 11.3271C5.13092 11.1854 5.15876 11.045 5.21295 10.9141C5.26721 10.7831 5.34709 10.6638 5.44733 10.5635C5.54764 10.4632 5.66686 10.3834 5.79791 10.3291C5.92887 10.2749 6.06926 10.2471 6.211 10.2471ZM9.13483 10.6123H15.712C16.1073 10.6126 16.4268 10.9317 16.4268 11.3271C16.4268 11.7226 16.1073 12.0417 15.712 12.042H9.13483C8.73925 12.042 8.41901 11.7227 8.41901 11.3271C8.41902 10.9316 8.73926 10.6123 9.13483 10.6123ZM6.211 6.59277C6.49757 6.59277 6.77301 6.70654 6.97565 6.90918C7.17816 7.11171 7.29193 7.38646 7.29205 7.67285C7.29205 7.95943 7.17829 8.23486 6.97565 8.4375C6.77301 8.64014 6.49757 8.75391 6.211 8.75391C5.9246 8.75379 5.64986 8.64001 5.44733 8.4375C5.24469 8.23486 5.13092 7.95943 5.13092 7.67285C5.13104 7.38644 5.24479 7.11171 5.44733 6.90918C5.64986 6.70665 5.92459 6.59289 6.211 6.59277ZM9.13483 6.95801H15.712C16.1072 6.95826 16.4266 7.27764 16.4268 7.67285C16.4268 8.06828 16.1073 8.38842 15.712 8.38867H9.13483C8.73925 8.38867 8.41901 8.06843 8.41901 7.67285C8.41925 7.27748 8.7394 6.95801 9.13483 6.95801Z" fill="#ACACAC" stroke="#ACACAC" strokeWidth="0.03125" />
                    </svg>

                    {/* Number list */}
                    <svg
                        onClick={() => editor.chain().focus().toggleOrderedList().run()}
                        className={`${style.toolbarBtn} ${editor.isActive("orderedList") ? style.active : ''}`}
                        width="22"
                        height="22"
                        viewBox="0 0 22 22"
                        fill="#141417">
                        <rect x="0.5" y="0.5" width="20.9232" height="20.9232" rx="7.5" fill="#141417" stroke="#ACACAC" />
                        <path d="M5.48358 12.3047C6.01897 11.5548 7.11714 11.5008 7.72479 12.1943C8.20576 12.7455 8.19406 13.5698 7.6994 14.1074L6.90546 14.9707L6.88104 14.9971H7.67499C7.96989 14.9972 8.20714 15.2344 8.20721 15.5293C8.20721 15.8243 7.96994 16.0614 7.67499 16.0615H5.66522C5.4544 16.0615 5.26121 15.9373 5.17694 15.7422C5.09273 15.5469 5.13072 15.3232 5.27264 15.168L6.9162 13.3867C7.03519 13.2565 7.04344 13.0635 6.94257 12.9238H6.94843L6.92596 12.8975C6.77111 12.7212 6.48993 12.7328 6.3537 12.9258L6.09784 13.2803C5.92705 13.5198 5.59428 13.575 5.35468 13.4043C5.11508 13.2335 5.05981 12.9008 5.23065 12.6611L5.48358 12.3047ZM10.05 13.9004H15.8957C16.2913 13.9004 16.6105 14.2206 16.6105 14.6162C16.6104 15.0117 16.2912 15.3311 15.8957 15.3311H10.05C9.65449 15.3311 9.3343 15.0117 9.33417 14.6162C9.33417 14.2206 9.65441 13.9004 10.05 13.9004ZM10.05 10.2471H15.8957C16.2912 10.2471 16.6104 10.5664 16.6105 10.9619C16.6105 11.3575 16.2913 11.6768 15.8957 11.6768H10.05C9.65441 11.6768 9.33417 11.3575 9.33417 10.9619C9.33427 10.5664 9.65447 10.2471 10.05 10.2471ZM6.03046 5.8623H6.76093C7.05595 5.8623 7.29401 6.09954 7.29413 6.39453V9.15039H7.67499C7.96994 9.15056 8.20721 9.3886 8.20721 9.68359C8.20703 9.97842 7.96982 10.2156 7.67499 10.2158H5.84784C5.55286 10.2158 5.3158 9.97853 5.31561 9.68359C5.31561 9.3885 5.55274 9.15039 5.84784 9.15039H6.2287V6.92676H6.03046C5.73536 6.92676 5.49823 6.68963 5.49823 6.39453C5.49835 6.09954 5.73543 5.8623 6.03046 5.8623ZM10.05 6.59277H15.8957C16.2913 6.59277 16.6105 6.91301 16.6105 7.30859C16.6103 7.704 16.2911 8.02344 15.8957 8.02344H10.05C9.65453 8.02344 9.33436 7.704 9.33417 7.30859C9.33417 6.91301 9.65441 6.59277 10.05 6.59277Z" fill="#ACACAC" stroke="#ACACAC" strokeWidth="0.03125" />
                    </svg>

                    {/* Image Button */}
                    <svg
                        onClick={() => fileInputRef.current?.click()}
                        className={style.toolbarImageBtn}
                        width="24"
                        height="24"
                        viewBox="0 0 24 24"
                        fill="none">
                        <path d="M8.9373 10C10.0342 10 10.9234 9.10457 10.9234 8C10.9234 6.89543 10.0342 6 8.9373 6C7.84042 6 6.95123 6.89543 6.95123 8C6.95123 9.10457 7.84042 10 8.9373 10Z" stroke="#ACACAC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M12.9094 2H8.9373C3.97215 2 1.98608 4 1.98608 9V15C1.98608 20 3.97215 22 8.9373 22H14.8955C19.8606 22 21.8467 20 21.8467 15V10" stroke="#ACACAC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M15.6403 5H21.1019" stroke="#ACACAC" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M18.3711 7.75V2.25" stroke="#ACACAC" strokeWidth="1.5" strokeLinecap="round" />
                        <path d="M2.65137 18.9496L7.54701 15.6396C8.33151 15.1096 9.46356 15.1696 10.1686 15.7796L10.4963 16.0696C11.2709 16.7396 12.5221 16.7396 13.2967 16.0696L17.4277 12.4996C18.2022 11.8296 19.4535 11.8296 20.228 12.4996L21.8467 13.8996" stroke="#ACACAC" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>

                <div className={style.editorActions}>
                    <CustomButton
                        type={'Cancel'}
                        onClick={onClose} />
                    <CustomButton
                        type={'Asign'}
                        disabled={isDisabledCreateButton}
                        style={{ opacity: isDisabledCreateButton ? 0.4 : 1 }}
                        onClick={onCreate} />
                </div>
            </div>
        </div>
    )
};

export default Editor;