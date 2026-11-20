import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function exportCsvFile(
  fileName: string,
  csvContent: string
): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error(
      'Compartilhamento nativo de arquivos não está disponível neste dispositivo.'
    );
  }

  // UTF-8 BOM ensures accented Portuguese characters open cleanly in Excel/Sheets
  const contentWithBom = `\uFEFF${csvContent}`;
  const file = new File(Paths.cache, fileName);
  file.create({ overwrite: true });
  await file.write(contentWithBom);

  await Sharing.shareAsync(file.uri, {
    mimeType: 'text/csv',
    dialogTitle: 'Exportar relatório de despesas (CSV)',
    UTI: 'public.comma-separated-values-text',
  });
}
