import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import type { Response } from 'express';
import { MulterError } from 'multer';

@Catch(MulterError)
export class SheetUploadFilter implements ExceptionFilter {
  catch(error: MulterError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const message =
      error.code === 'LIMIT_FILE_SIZE' ? 'Le fichier dépasse 15 Mo.' : 'Le fichier n’a pas pu être reçu.';
    response.status(400).json({ statusCode: 400, message });
  }
}
